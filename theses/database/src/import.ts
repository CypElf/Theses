import fs from "fs"
import csv from "csv-parser"
import { createClient, SchemaFieldTypes } from "redis"
import MeiliSearch, { Index } from "meilisearch"
import { Institution, These } from "./schema"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getUpdates = async (index: Index, updateIds: number[]) => await Promise.all(updateIds.map(async id => await index.getUpdateStatus(id)))

async function parseThesesFromCsv(file: string): Promise<These[]> {
    if (!fs.existsSync(file)) {
        throw new Error(`Failed to import theses from CSV, because the file ${file} was not found`)
    }

    const stream = fs.createReadStream(file)
        .pipe(csv({ separator: ";", skipLines: 1, quote: "", headers: [
            "authors",
            "authors_id",
            "title",
            "directors",
            "directors_reversed",
            "directors_id",
            "presentation_institution",
            "institution_id",
            "domain",
            "finished",
            "inscription_date",
            "presentation_date",
            "language",
            "these_id",
            "available_online",
            "upload_date",
            "update_date"
        ], mapValues: ({ header, index, value }: { header: string, index: number, value: string }) => {
            if (value.length === 0) return null
            
            if (["authors", "authors_id", "directors", "directors_reversed", "directors_id"].includes(header)) {
                return value.split(",").filter(v => v !== "")
            }
            if (header === "finished") {
                return value === "soutenue"
            }
            if (header === "available_online") {
                return value === "oui"
            }
            if (["inscription_date", "presentation_date", "upload_date", "update_date"].includes(header)) {
                if (value) {
                    const [day, month, year] = value.split("-")
                    
                    const date = new Date(Date.UTC(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day)))
                    
                    if (!isNaN(date.getTime())) return date.getTime()
                }
            }

            return value
        } }))
    
    const results: These[] = []

    let i = 0
    for await (const data of stream) {
        results.push({ id: i, ...data })
        i++
    }

    return results
}

async function parseInstitutionsFromJson(file: string): Promise<Institution[]> {
    if (!fs.existsSync(file)) {
        throw new Error(`Failed to import geographic informations from JSON, because the file ${file} was not found`)
    }

    const placesData: Institution[] = require("../../" + file).map((place: any) => ({ id: place.fields.identifiant_idref, name: place.fields.uo_lib_officiel, coords: `${place.fields.coordonnees[1]},${place.fields.coordonnees[0]}` }))

    return placesData
}

async function importAll(db?: string) {
    const thesesFile = "./res/theses.csv"
    const institutionsFile = "./res/institutions.json"

    console.log("Parsing the theses...")
    const theses = await parseThesesFromCsv(thesesFile)

    if (db === "redis" || db === undefined) {
        const redis = createClient({
            password: process.env["REDIS_AUTH"]
        })
        await redis.connect()

        console.log("Parsing the institutions...")
        const institutions = await parseInstitutionsFromJson(institutionsFile)

        console.log("Flushing Redis...")
        await redis.flushDb()
        const promises = []
    
        console.log("Sending all the insertions requests to Redis...")
        let i = 0
        for (const these of theses) {
            promises.push(redis.json.set(`these:${i}`, ".", {
                ...these,
                institution_id: these.institution_id ?? "",
                finished: these.finished ? 1 : 0,
                available_online: these.available_online ? 1 : 0,
                presentation_date: these.presentation_date ?? -1 // We need this field to never be null because it prevents RediSearch from indexing the whole associated JSON object. As we're going to perform timestamp comparisons on this, setting it to a negative value guarantees the object to be ignored by those.
            }))
            i++
        }
    
        i = 0
        for (const institution of institutions) {
            promises.push(redis.json.set(`institution:${i}`, ".", {
                ...institution
            }))
            i++
        }
    
        console.log("Waiting for all the insertions to complete...")
        await Promise.all(promises)
    
        console.log("Creating the theses index...")
        // @ts-ignore: next-line
        await redis.ft.create("idx:theses", {
            "$.title": {
                type: SchemaFieldTypes.TEXT,
                WEIGHT: 3,
                AS: "title"
            },
            "$.presentation_institution": {
                type: SchemaFieldTypes.TEXT,
                AS: "presentation_institution"
            },
            "$.finished": {
                type: SchemaFieldTypes.NUMERIC,
                AS: "finished"
            },
            "$.presentation_date": {
                type: SchemaFieldTypes.NUMERIC,
                AS: "presentation_date"
            },
            "$.institution_id": {
                type: SchemaFieldTypes.TEXT,
                AS: "institution_id"
            }
        }, {
            ON: "JSON",
            PREFIX: "these:"
        })
    
        console.log("Creating the institutions index...")
        // @ts-ignore: next-line
        await redis.ft.create("idx:institutions", {
            "$.coords": {
                type: SchemaFieldTypes.GEO,
                AS: "coords"
            }
        }, {
            ON: "JSON",
            PREFIX: "institution:"
        })
    
        console.log("All done for Redis.")
    }

    if (db === "meilisearch" || db === undefined) {
        const meili = new MeiliSearch({
            host: "http://127.0.0.1:7700",
            apiKey: process.env["MEILISEARCH_AUTH"]
        })
        
        const index = meili.index("theses")
    
        console.log("Flushing MeiliSearch...")
        await index.deleteAllDocuments()
        const updateIds = []
    
        console.log("Inserting the theses in MeiliSearch...")
        for (let j = 0; j < theses.length; j += 50_000) { // split the data in groups of 50 000 to avoid sending a payload too big for MeiliSearch (slower but much more memory efficient)
            const pending = await index.addDocuments(theses.slice(j, j + 50_000))
            updateIds.push(pending.updateId)
        }
    
        let status = (await getUpdates(index, updateIds)).map(update => update.status)
    
        console.log("Waiting for MeiliSearch to process all the theses...")
        while (status.includes("processing") || status.includes("enqueued")) {
            if (status.includes("failed")) {
                console.error((await getUpdates(index, updateIds)).find(update => update.status === "failed"))
                throw new Error("Failed to import in MeiliSearch.")
            }
            await sleep(300) // wait for all the addDocuments to end
            status = (await getUpdates(index, updateIds)).map(update => update.status)
        }
    
        if (status.includes("failed")) {
            console.error((await getUpdates(index, updateIds)).find(update => update.status === "failed"))
                throw new Error("Failed to import in MeiliSearch.")
        }
    
        console.log("All done for MeiliSearch.")
    }
}

const db = process.argv[2]?.toLowerCase()

if (db !== undefined && db !== "redis" && db !== "meilisearch") {
    console.error("Wrong db argument")
}
else {
    importAll(db)
}
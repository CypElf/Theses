import fs from "fs"
import csv from "csv-parser"
import { Institution, RedisClientType, These } from "./schema"
import { SchemaFieldTypes } from "redis"

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
                return value === "soutenue" ? 1 : 0
            }
            if (header === "available_online") {
                return value === "oui" ? 1 : 0
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
    
    let max1 = 0
    let max2 = 0

    for await (const data of stream) {
        if (data.authors.includes("Thomas Fressin")) {
            console.log(data)
        }
        try {
            if (data.authors && data.authors.length > max1) max1 = data.authors.length
            if (data.directors && data.directors.length > max2) max2 = data.directors.length
        }
        catch (err) {
            console.error(err)
        }
        results.push(data)
    }

    console.log("max1", max1)
    console.log("max2", max2)

    return results
}

async function parseInstitutionsFromJson(file: string): Promise<Institution[]> {
    if (!fs.existsSync(file)) {
        throw new Error(`Failed to import geographic informations from JSON, because the file ${file} was not found`)
    }

    const placesData: Institution[] = require("../../" + file).map((place: any) => ({ id: place.fields.identifiant_idref, name: place.fields.uo_lib_officiel, coords: `${place.fields.coordonnees[1]},${place.fields.coordonnees[0]}` }))

    return placesData
}

export async function importAll(thesesFile: string, institutionsFile: string, redis: RedisClientType) {
    console.log("Parsing the theses...")
    const theses = await parseThesesFromCsv(thesesFile)
    console.log("Parsing the institutions...")
    const institutions = await parseInstitutionsFromJson(institutionsFile)

    console.log("Flushing the database...")
    await redis.flushDb()
    const promises = []

    let i = 0
    for (const these of theses) {
        if (these.authors.includes("Thomas Fressin")) {
            // these.title = "TESTESTEST"
            // these.authors = ["TEST"]
            these.directors = ["TEST", "TEST"]
            // these.finished = 1
            // these.presentation_institution = "TEST"
            console.log(i, these)
        }
        promises.push(redis.json.set(`these:${i}`, ".", {
            ...these
        }))
        i++
    }

    console.log("number of theses inserted:", i)

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
        "$.authors.[*]": {
            type: SchemaFieldTypes.TEXT,
            AS: "authors"
        },
        "$.directors.[*]": {
            type: SchemaFieldTypes.TEXT,
            AS: "directors"
        },
        "$.finished": {
            type: SchemaFieldTypes.NUMERIC,
            AS: "finished"
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

    console.log("All done.")
}
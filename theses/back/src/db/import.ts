import fs from "fs"
import csv from "csv-parser"
import { Index } from "meilisearch"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getUpdates = async (index: Index, updateIds: number[]) => await Promise.all(updateIds.map(async id => await index.getUpdateStatus(id)))

export async function thesesImportFromCsv(file: string, index: Index): Promise<boolean> {
    if (!fs.existsSync(file)) {
        console.error(`Failed to import theses from CSV, because the file ${file} was not found`)
        return false
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

    console.log("Starting import, this can take a few minutes depending on the file size...")
    
    const results = []
    let i = 0
    
    console.log("Parsing CSV...")
    for await (const data of stream) {
        results.push({ id: i, ...data })
        i++
    }
        
    console.log(`Inserting the ${i} rows in the database...`)

    return await importAndCheck(results, index)
}

export async function geoImportFromJson(file: string, index: Index): Promise<boolean> {    
    if (!fs.existsSync(file)) {
        console.error(`Failed to import geography informations from JSON, because the file ${file} was not found`)
        return false
    }    

    const placesData = require("../../" + file).map((place: any, i: number) => {
        const { coordonnees, ...otherFields } = place.fields
        
        return { id: i, ...otherFields, _geo: { lat: Number.parseFloat(coordonnees[0]), lng: Number.parseFloat(coordonnees[1]) } }
    })    

    return await importAndCheck(placesData, index)
}

async function importAndCheck(data: object[], index: Index): Promise<boolean> {
    await index.deleteAllDocuments()

    const updateIds = []
    
    for (let j = 0; j < data.length; j += 50_000) { // split the data in groups of 50 000 to avoid sending a payload too big for MeiliSearch (slower but much more memory efficient)
        
        const pending = await index.addDocuments(data.slice(j, j + 50_000))
        updateIds.push(pending.updateId)
    }

    let status = (await getUpdates(index, updateIds)).map(update => update.status)

    while (status.includes("processing")) {
        if (status.includes("failed")) {
            console.error("Failed to import in the database. Update dump:", (await getUpdates(index, updateIds)).find(update => update.status === "failed"))
            return false
        }
        await sleep(500) // wait for all the addDocuments to end
        status = (await getUpdates(index, updateIds)).map(update => update.status)
    }

    if (status.includes("failed")) {
        console.error("Failed to import in the database. Update dump:", (await getUpdates(index, updateIds)).find(update => update.status === "failed"))
        return false
    }

    return true
}
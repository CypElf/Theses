import fs from "fs"
import csv from "csv-parser"
import { Index } from "meilisearch"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getUpdates = async (index: Index, updateIds: number[]) => await Promise.all(updateIds.map(async id => await index.getUpdateStatus(id)))

export async function importFromCsv(file: string, index: Index): Promise<boolean> {
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

    const updateIds = []
    
    for (let j = 0; j < results.length; j += 50_000) { // split the data in groups of 50 000 to avoid sending a payload too big for MeiliSearch
        const pending = await index.addDocuments(results.slice(j, j + 50_000))
        updateIds.push(pending.updateId)
    }
    
    let status = (await getUpdates(index, updateIds)).map(update => update.status)

    while (status.includes("processing")) {
        if (status.includes("failed")) {
            console.error("Failed to import a row in the database. Update dump:", (await getUpdates(index, updateIds)).find(update => update.status === "failed"))
            return false
        }
        await sleep(10_000) // wait for all the addDocuments to end

        status = (await getUpdates(index, updateIds)).map(update => update.status)
    }

    if (status.includes("failed")) {
        console.error("Failed to import a row in the database. Update dump:", (await getUpdates(index, updateIds)).find(update => update.status === "failed"))
        return false
    }

    console.log("Import successful")

    return true
}
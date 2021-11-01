import fs from "fs"
import csv from "csv-parser"
import { These } from "./structure"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function importFromCsv(file: string) {
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
            "id",
            "available_online",
            "upload_date",
            "update_date"
        ], mapValues: ({ header, index, value }: { header: string, index: number, value: string }) => {
            if (value.length === 0) return null

            if (["authors", "authors_id", "directors", "directors_reversed", "directors_id"].includes(header)) {
                return value.split(",")
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

    await These.deleteMany({}) // clear all the theses in the database before import

    let i = 0

    for await (const data of stream) {
        const theseEntry = new These({
            ...data
        })
        theseEntry.save((err: any) => {
            if (err) console.error(`Save error at the ${i}th entry: `, err)
        })
        i++

        if (i % 30_000 === 0) {
            await sleep(2500) // wait a bit sometimes so all the asynchronous writes to the database with the .save() method can be done and garbage collected to avoid heap saturation
        }
    }

    console.log(`Successfully imported ${i} documents`)
}
import fs from "fs"
import csv from "csv-parser"
import mongoose from "mongoose"

const theseSchema = new mongoose.Schema({
    authors: [String],
    authors_id: [String],
    title: String,
    directors: [String],
    directors_reversed: [String],
    directors_id: [String],
    presentation_institution: String,
    institution_id: String,
    domain: String,
    finished: Boolean,
    inscription_date: String,
    presentation_date: String,
    language: String,
    id: String,
    available_online: Boolean,
    upload_date: String,
    update_date: String
})

const These = mongoose.model("theses", theseSchema)

interface Entry {
    authors: string[],
    authors_id: string[] | null
    title: string,
    directors: string[],
    directors_reversed: string[],
    directors_id: string[],
    presentation_institution: string,
    institution_id: string,
    domain: string,
    finished: boolean,
    inscription_date: string,
    presentation_date: string | null,
    language: string | null,
    id: string,
    available_online: boolean,
    upload_date: string,
    update_date: string
}

export async function importFromCsv(file: string) {
    const stream = fs.createReadStream(file)
        .pipe(csv({ separator: ";", skipLines: 1, headers: [
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
            if (["authors", "directors", "directors_reversed", "directors_id"].includes(header)) {
                return value.split(",")
            }
            if (header === "authors_id") {
                return value.length === 0 ? null : value.split(",")
            }
            if (header === "finished") {
                return value === "soutenue"
            }
            if (header === "language" || header === "presentation_date") {
                return value.length === 0 ? null : value
            }
            if (header === "available_online") {
                return value === "oui"
            }

            return value
        } }))

    console.log("Starting import, this can take a few minutes depending on the file size...")

    await These.deleteMany({}) // clear all the theses before import

    let i = 0
    for await (const data of stream) {
        if (data.id !== undefined) { // broken fields with no id are ignored
            const theseEntry = new These({
                ...data
            })
            theseEntry.save((err: any) => {
                if (err) console.error(`Save error at the ${i}th entry: `, err)
            })
            i++
        }
    }

    console.log(`Successfully imported ${i} documents`)
}
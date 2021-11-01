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

export const These = mongoose.model("theses", theseSchema)
import express from "express"
import mongoose from "mongoose"
import { StatusCodes } from "http-status-codes"
import dotenv from "dotenv"
import { exit } from "process"
import { importFromCsv } from "./db/import"

async function main() {
    dotenv.config()

    if (!process.env["MONGODB_USER"]) {
        console.error("Missing the `MONGODB_USER` environment variable (please specify it in the `.env` file)")
        exit(1)
    }
    if (!process.env["MONGODB_PASSWORD"]) {
        console.error("Missing the `MONGODB_PASSWORD` environment variable (please specify it in the `.env` file)")
        exit(1)
    }
    
    await mongoose.connect(`mongodb://${process.env["MONGODB_USER"]}:${process.env["MONGODB_PASSWORD"]}@localhost/theses_back`)
    
    const port = 12000
    
    const app = express()
    app.use(express.json())
    
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
    
    app.get("/theses", (req, res) => {
        // const { limit, query } = req.query

        res.send("WIP")
    })
    
    app.put("/import", async (req, res) => {
        await importFromCsv("./res/complet.csv")
        res.sendStatus(StatusCodes.NO_CONTENT)
    })
}

main()
import express from "express"
import { MeiliSearch } from 'meilisearch'
import { StatusCodes } from "http-status-codes"
import dotenv from "dotenv"
import { exit } from "process"
import { importFromCsv } from "./db/import"

async function main() {
    dotenv.config()

    if (!process.env["MEILISEARCH_MASTER_KEY"]) {
        console.error("Missing the `MEILISEARCH_MASTER_KEY` environment variable (please specify it in the `.env` file)")
        exit(1)
    }
    
    const meili = new MeiliSearch({
        host: "http://127.0.0.1:7700",
        apiKey: process.env["MEILISEARCH_MASTER_KEY"]
    })

    await meili.health()
    const index = meili.index("theses")

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
        const success = await importFromCsv("./res/complet.csv", index)
        if (success) res.sendStatus(StatusCodes.NO_CONTENT)
        else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
    })
}

main()
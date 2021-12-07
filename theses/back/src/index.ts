import express from "express"
import cors from "cors"
import { MeiliSearch } from 'meilisearch'
import dotenv from "dotenv"
import { exit } from "process"
import fs from "fs"

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

    const port = 12000
    
    const app = express()
    app.use(express.json())
    app.use(cors())
    
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
    
    for (const filename of fs.readdirSync(__dirname + "/routes")) {
        const { setupRoute } = require(__dirname + "/routes/" + filename)
        setupRoute(app, meili)
    }    
}

main()
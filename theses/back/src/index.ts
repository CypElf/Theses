import express from "express"
import cors from "cors"
import { MeiliSearch } from 'meilisearch'
import { StatusCodes } from "http-status-codes"
import dotenv from "dotenv"
import { exit } from "process"
import { thesesImportFromCsv, geoImportFromJson } from "./db/import"

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
    const thesesIndex = meili.index("theses")
    const geoIndex = meili.index("geo")

    const port = 12000
    
    const app = express()
    app.use(express.json())
    app.use(cors())
    
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
    
    app.get("/theses", async (req, res) => {
        const { limit, query, offset } = req.query as { limit: string | undefined, query: string | undefined, offset: string | undefined }

        if (limit && isNaN(Number.parseInt(limit)) || offset && (isNaN(Number.parseInt(offset)) || Number.parseInt(offset) < 0)) return res.sendStatus(StatusCodes.BAD_REQUEST)

        const limitNumber = limit ? Number.parseInt(limit) : 20
        const offsetNumber = offset ? Number.parseInt(offset) * limitNumber : 0
        const results = await thesesIndex.search(query, { limit: limitNumber, offset: offsetNumber })

        res.send(results)
    })
    
    app.get("/institutions", async (req, res) => {
        const { lat, lng, rad } = req.query as { lat: string | undefined, lng: string | undefined, rad: string | undefined }

        if (!lat || !lng || !rad) return res.sendStatus(StatusCodes.BAD_REQUEST)

        const places = await geoIndex.search("", { filter: [`_geoRadius(${lat}, ${lng}, ${rad})`] })
        res.send(places)
    })

    app.put("/import", async (req, res) => {
        const success = await thesesImportFromCsv("./res/theses.csv", thesesIndex)
        if (success) res.sendStatus(StatusCodes.NO_CONTENT)
        else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
    })

    app.put("/import-geo", async (req, res) => {
        const success = await geoImportFromJson("./res/etablissements.json", geoIndex)
        if (success) res.sendStatus(StatusCodes.NO_CONTENT)
        else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
    })
}

main()
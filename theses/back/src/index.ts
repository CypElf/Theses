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
        const { query, offset } = req.query as { query: string | undefined, offset: string | undefined }

        if (offset && (isNaN(Number.parseInt(offset)) || Number.parseInt(offset) < 0)) return res.sendStatus(StatusCodes.BAD_REQUEST)

        const offsetNumber = offset ? Number.parseInt(offset) * 20 : 0
        const results = await thesesIndex.search(query, { limit: 500, offset: offsetNumber })

        const finishedCount = (await thesesIndex.search(query, { limit: 500, filter: "finished = true" })) // 2000 is somehow arbitrary. It should in theory be 0, as we don't care about the results. But in practice, when the limit is too low, for a non identified reason, the search returns a nbHits way lower than the reality. This is VERY annoying and this applies for every search here

        console.log("query:", query)

        console.log(finishedCount.nbHits, "finished among", results.nbHits)

        const minYear = 1970
        const maxYear = 2021

        const thesesPerYear = new Map()

        for (let currentYear = minYear; currentYear <= maxYear; currentYear++) {
            const yearBeginning = Date.UTC(currentYear, 0, 1)
            const yearEnding = Date.UTC(currentYear, 11, 31, 23, 59, 59)
            const thesesThisYear = (await thesesIndex.search(query, { limit: 500, filter: `presentation_date >= ${yearBeginning} AND presentation_date <= ${yearEnding}` })) // 500 instead of 200 as it's enough and a limit of 2000 in loop is very slow
            thesesPerYear.set(currentYear, thesesThisYear.nbHits)
        }

        results.hits = results.hits.slice(0, 20)
        results.limit = 20
        res.send({ nbFinished: finishedCount.nbHits, thesesPerYear: Object.fromEntries(thesesPerYear), ...results })
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
import { Express } from "express"
import { StatusCodes } from "http-status-codes"
import MeiliSearch from "meilisearch"
import { thesesImportFromCsv } from "../db/import"

module.exports = {
    setupRoute: (app: Express, meili: MeiliSearch) => {
        app.put("/import", async (req, res) => {
            const thesesIndex = meili.index("theses")

            const success = await thesesImportFromCsv("./res/theses.csv", thesesIndex)
            if (success) res.sendStatus(StatusCodes.NO_CONTENT)
            else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
        })
    }
}
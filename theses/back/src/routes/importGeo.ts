import { Express } from "express"
import { StatusCodes } from "http-status-codes"
import MeiliSearch from "meilisearch"
import { geoImportFromJson } from "../db/import"

module.exports = {
    setupRoute: (app: Express, meili: MeiliSearch) => {
        app.put("/import-geo", async (req, res) => {
            const geoIndex = meili.index("geo")

            const success = await geoImportFromJson("./res/etablissements.json", geoIndex)
            if (success) res.sendStatus(StatusCodes.NO_CONTENT)
            else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
        })
    }
}
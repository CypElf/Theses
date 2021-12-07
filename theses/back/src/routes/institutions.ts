import { Express } from "express"
import { StatusCodes } from "http-status-codes"
import MeiliSearch from "meilisearch"

module.exports = {
    setupRoute: (app: Express, meili: MeiliSearch) => {
        app.get("/institutions", async (req, res) => {
            const { lat, lng, rad } = req.query as { lat: string | undefined, lng: string | undefined, rad: string | undefined }
        
            if (!lat || !lng || !rad) return res.sendStatus(StatusCodes.BAD_REQUEST)
        
            const geoIndex = meili.index("geo")
        
            const places = await geoIndex.search("", { filter: [`_geoRadius(${lat}, ${lng}, ${rad})`] })
            res.send(places)
        })
    }
}
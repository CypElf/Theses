import { FastifyInstance, FastifyRequest } from "fastify"
import { StatusCodes } from "http-status-codes"
import MeiliSearch from "meilisearch"
import { RedisClientType } from "../db/schema"
import { importAll } from "../db/import"

type ImportRequest = FastifyRequest<{
    Body: {
        db?: string
    }
}>

export default async function routes(app: FastifyInstance, { redis, meili }: { redis: RedisClientType, meili: MeiliSearch }) {
    app.put("/import", async (req: ImportRequest, res) => {
        const db = req.body?.db
        try {
            await importAll("./res/theses.csv", "./res/institutions.json", redis, meili, db)
            res.status(StatusCodes.NO_CONTENT)
        }
        catch {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        }

        res.send()
    })
}
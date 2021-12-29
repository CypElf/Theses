import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { RedisClientType } from "../db/schema"
import { importAll } from "../db/import"

export default async function routes(app: FastifyInstance, { redis }: { redis: RedisClientType }) {
    app.put("/import", async (req, res) => {
        try {
            await importAll("./res/theses.csv", "./res/institutions.json", redis)
            res.status(StatusCodes.NO_CONTENT)
        }
        catch {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        }

        res.send()
    })
}
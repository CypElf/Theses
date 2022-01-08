import { FastifyInstance } from "fastify"
import { RedisClientType } from "../db/schema"

export default async function routes(app: FastifyInstance, { redis }: { redis: RedisClientType }) {
    app.get("/institutions", async (req, res) => {
        const institutions = await redis.ft.search("idx:institutions", "*", {
            LIMIT: {
                from: 0,
                size: 10000 // there's only between 200 and 300 institutions in the dataset, so 10000 should be enough to get all of them even if it increases in the future
            }
        })

        res.send({
            institutions: institutions.documents.map(institution => ({ id: institution.value.id, name: institution.value.name })).filter(institution => institution.id !== undefined)
        })
    })
}
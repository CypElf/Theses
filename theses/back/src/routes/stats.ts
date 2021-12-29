import { FastifyInstance } from "fastify"
import { RedisClientType } from "../db/schema"

export default async function routes(app: FastifyInstance, { redis }: { redis: RedisClientType }) {
    app.get("/stats", async (req, res) => {
        const finishedStat = await redis.ft.search("idx:theses", "@finished:[1 1]")
        const thesesInfo = await redis.ft.info("idx:theses")

        const minYear = 1970
        const maxYear = (new Date()).getFullYear()

        const thesesPerYear = new Map()

        for (let year = minYear; year <= maxYear; year++) {
            const yearBeginning = Date.UTC(year, 0, 1)
            const yearEnding = Date.UTC(year, 11, 31, 23, 59, 59)
            
            const quantity = await redis.ft.search("idx:theses", `@presentation_date:[${yearBeginning} ${yearEnding}]`)

            console.log(year, quantity.total, yearBeginning, yearEnding)

            thesesPerYear.set(year, quantity.total)
        }

        res.send({
            finished: finishedStat.total,
            total: Number.parseInt(thesesInfo.numDocs),
            thesesPerYear: Object.fromEntries(thesesPerYear)
        })
    })
}
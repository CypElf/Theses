import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import MeiliSearch from "meilisearch"
import { RedisClientType } from "../db/schema"

interface ThesesReqQuery {
    limit?: string,
    query?: string,
    offset?: string,
    year?: string,
    finished?: string
}

function getDateFilterForYear(year: number) {
    const yearBeginning = Date.UTC(year, 0, 1)
    const yearEnding = Date.UTC(year, 11, 31, 23, 59, 59)

    return `presentation_date >= ${yearBeginning} AND presentation_date <= ${yearEnding}`
}

export default async function routes(app: FastifyInstance, { redis, meili }: { redis: RedisClientType, meili: MeiliSearch }) {
    app.get("/theses", async (req, res) => {
        const { limit, query, offset, year, finished } = req.query as ThesesReqQuery

        if (limit && (isNaN(Number.parseInt(limit)) || Number.parseInt(limit) < 0 || Number.parseInt(limit) > 20) || offset && (isNaN(Number.parseInt(offset)) || Number.parseInt(offset) < 0)) return res.status(StatusCodes.BAD_REQUEST).send()

        const thesesIndex = meili.index("theses")

        const yearFilter = year !== undefined && !isNaN(Number.parseInt(year)) ? getDateFilterForYear(Number.parseInt(year)) : undefined
        const finishedFilter = finished !== undefined ? `finished = ${finished}` : undefined

        const meiliFilter = [yearFilter, finishedFilter].filter(f => f !== undefined).join(" AND ")

        const limitNumber = limit ? Number.parseInt(limit) : 20
        const offsetNumber = offset ? Number.parseInt(offset) * limitNumber : 0

        const results = await thesesIndex.search(query, {
            limit: limitNumber,
            offset: offsetNumber,
            filter: meiliFilter !== "" ? meiliFilter : undefined
        })

        let nbHits = results.nbHits

        // we query the last entry and compare the nbHits with the previous one to force MeiliSearch to give us the exact number of hits and not just an approximation
        // it's a bit less efficient because we will be making several requests instead of only one, but it's still fast and it prevents a pagination glitch client side (when the user ask for the last page and MeiliSearch suddenly gives a bigger nbHits)
        while (true) {
            const resultsOnLastEntry = await thesesIndex.search(query, {
                limit: 1,
                offset: nbHits,
                filter: meiliFilter !== "" ? meiliFilter : undefined
            })

            if (resultsOnLastEntry.nbHits > nbHits) nbHits = resultsOnLastEntry.nbHits
            else break
        }

        res.send({
            hits: results.hits,
            nbHits,
            query: results.query,
            limit: results.limit,
            offset: results.offset
        })
    })
}
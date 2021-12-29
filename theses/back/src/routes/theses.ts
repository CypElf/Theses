import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import MeiliSearch from "meilisearch"
import { RedisClientType } from "../db/schema"

interface ThesesReqQuery {
    limit: string | undefined,
    query: string | undefined,
    offset: string | undefined,
    year: string | undefined,
    finished: string | undefined
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

        // const results = await redis.ft.search("idx:theses", query ?? "*", {
        //     LIMIT: {
        //         from: offset ?? 0,
        //         size: limit ?? 20
        //     }
        // })
        // const convertedResults = results.documents.map(doc => ({ ...doc, value: { ...doc.value, finished: doc.value.finished === 1, available_online: doc.value.available_online === 1 } })) // because Redis can't deal with booleans, these are stored as 0 and 1 in the database, so we convert these fields back to booleans before sending them in the response

        // const finishedStat = await redis.ft.search("idx:theses", (query ? (`${query} `) : "") + "@finished:[1 1]")

        // res.send({
        //     finished: finishedStat.total,
        //     ...results,
        //     documents: convertedResults
        // })

        const thesesIndex = meili.index("theses")

        const yearFilter = year !== undefined && !isNaN(Number.parseInt(year)) ? getDateFilterForYear(Number.parseInt(year)) : undefined
        const finishedFilter = finished !== undefined ? `finished = ${finished}` : undefined

        const meiliFilter = [yearFilter, finishedFilter].filter(f => f !== undefined).join(" AND ")

        const limitNumber = limit ? Number.parseInt(limit) : 20
        const offsetNumber = offset ? Number.parseInt(offset) * limitNumber : 0
        const results = await thesesIndex.search(query, {
            limit: 200,
            offset: offsetNumber,
            filter: meiliFilter !== "" ? meiliFilter : undefined
        })

        results.hits = results.hits.slice(0, limitNumber)
        results.limit = limitNumber

        res.send({
            hits: results.hits,
            nbHits: results.nbHits,
            query: results.query,
            limit: results.limit,
            offset: results.offset
        })
    })
}
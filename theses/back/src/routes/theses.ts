import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { RedisClientType } from "../db/schema"

interface ReqQuery {
    limit: string | undefined,
    query: string | undefined,
    offset: string | undefined,
    year: number | undefined,
    finished: boolean | undefined
}

function getDateFilterForYear(year: number) {
    const yearBeginning = Date.UTC(year, 0, 1)
    const yearEnding = Date.UTC(year, 11, 31, 23, 59, 59)

    return `presentation_date >= ${yearBeginning} AND presentation_date <= ${yearEnding}`
}

export default async function routes(app: FastifyInstance, { redis }: { redis: RedisClientType }) {
    app.get("/theses", async (req, res) => {
        const { limit, query, offset, year, finished } = req.query as ReqQuery

        if (limit && (isNaN(Number.parseInt(limit)) || Number.parseInt(limit) < 0 || Number.parseInt(limit) > 20) || offset && (isNaN(Number.parseInt(offset)) || Number.parseInt(offset) < 0)) return res.status(StatusCodes.BAD_REQUEST).send()

        const results = await redis.ft.search("idx:theses", query ?? "*", {
            LIMIT: {
                from: offset ?? 0,
                size: limit ?? 20
            }
        })
        const convertedResults = results.documents.map(doc => ({ ...doc, value: { ...doc.value, finished: doc.value.finished === 1, available_online: doc.value.available_online === 1 } })) // because Redis can't deal with booleans, these are stored as 0 and 1 in the database, so we convert these fields back to booleans before sending them in the response

        const finishedStat = await redis.ft.search("idx:theses", (query ? (`${query} `) : "") + "@finished:[1 1]")

        res.send({
            finished: finishedStat.total,
            ...results,
            documents: convertedResults
        })

        // const thesesIndex = meili.index("theses")

        // const yearFilter = year !== undefined ? getDateFilterForYear(year) : undefined
        // const finishedFilter = finished !== undefined ? `finished = ${finished.toString()}` : undefined

        // const meiliFilter = [yearFilter, finishedFilter].filter(f => f !== undefined).join(" AND ")

        // const limitNumber = limit ? Number.parseInt(limit) : 20
        // const offsetNumber = offset ? Number.parseInt(offset) * limitNumber : 0
        // const results = await thesesIndex.search(query, {
        //     limit: 200,
        //     offset: offsetNumber,
        //     filter: meiliFilter !== "" ? meiliFilter : undefined
        // })

        // let finishedCount

        // if (finished !== undefined && finished === true) {
        //     finishedCount = results.nbHits // we don't need to make an extra request to see how many are finished if we already asked for only those finished
        // }
        // else {
        //     finishedCount = (await thesesIndex.search(query, {
        //         limit: 200,
        //         filter: "finished = true" + (meiliFilter ? (" AND " + meiliFilter) : ""),
        //     })).nbHits // 200 is somehow arbitrary. It should in theory be 0, as we don't care about the results. But in practice, when the limit is too low, for a non identified reason, the search returns a nbHits way lower than the reality. This is VERY annoying and this applies for every search here
        // }

        // const minYear = 1970
        // const maxYear = 2021

        // const thesesPerYear = new Map()

        // for (let currentYear = minYear; currentYear <= maxYear; currentYear++) {
        //     const thesesThisYear = (await thesesIndex.search(query, {
        //         limit: 100,
        //         filter: getDateFilterForYear(currentYear) + (meiliFilter ? (" AND " + meiliFilter) : "")
        //     }))
        //     thesesPerYear.set(currentYear, thesesThisYear.nbHits)
        // }

        // results.hits = results.hits.slice(0, limitNumber)
        // results.limit = limitNumber

        // const institutionsIds = await thesesIndex.search(query, {
        //     attributesToRetrieve: ["institution_id"],
        //     filter: meiliFilter !== "" ? meiliFilter : undefined,
        //     limit: Number.MAX_SAFE_INTEGER
        // })

        // console.log(institutionsIds.hits.length)
        // console.log([...new Set(institutionsIds.hits.map(d => d.institution_id))].length)

        // // const geoIndex = meili.index("geo")
        // // geoIndex.search("", {
        // //     filter: results.
        // // })

        // res.send({ nbFinished: finishedCount, thesesPerYear: Object.fromEntries(thesesPerYear), ...results })
    })
}
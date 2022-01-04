import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { RedisClientType } from "../db/schema"

interface StatsReqQuery {
    year?: string,
    finished?: string
}

export default async function routes(app: FastifyInstance, { redis }: { redis: RedisClientType }) {
    app.get("/stats", async (req, res) => {
        const { year: yearStr, finished: finishedStr } = req.query as StatsReqQuery

        if (yearStr !== undefined && isNaN(Number.parseInt(yearStr)) || finishedStr !== undefined && finishedStr !== "true" && finishedStr !== "false") res.status(StatusCodes.BAD_REQUEST)

        const year = yearStr ? Number.parseInt(yearStr) : undefined
        const finished = finishedStr !== undefined ? finishedStr === "true" : undefined

        const hasOptions = year !== undefined || finished !== undefined

        const optionalFinishedFilter = finished !== undefined ? `@finished:[${finished ? 1 : 0} ${finished ? 1 : 0}]` : ""
        const optionalYearFilter = year ? `@presentation_date:[${Date.UTC(year, 0, 1)} ${Date.UTC(year, 11, 31, 23, 59, 59)}]` : ""

        const searchFilter = optionalYearFilter + (optionalFinishedFilter ? (" " + optionalFinishedFilter) : "")

        const finishedStat = (await redis.ft.search("idx:theses", `@finished:[1 1] ${searchFilter}`)).total

        const totalStat = !hasOptions
            ? Number.parseInt((await redis.ft.info("idx:theses")).numDocs)
            : (await redis.ft.search("idx:theses", searchFilter)).total

        const minYear = 1970
        const maxYear = (new Date()).getFullYear()

        const thesesPerYear = new Map()

        for (let year = minYear; year <= maxYear; year++) {
            const yearBeginning = Date.UTC(year, 0, 1)
            const yearEnding = Date.UTC(year, 11, 31, 23, 59, 59)
            
            const quantity = await redis.ft.search("idx:theses", `@presentation_date:[${yearBeginning} ${yearEnding}] ${searchFilter}`)

            thesesPerYear.set(year, quantity.total)
        }

        const institutions = await redis.ft.search("idx:institutions", "*", {
            LIMIT: {
                from: 0,
                size: 1000 // there's only between 200 and 300 institutions in the dataset, so 1000 should be fine to get all of them even if it increases in the future
            }
        })

        const formattedInstitutions = await Promise.all(institutions.documents.filter(institution => institution.value.id).map(async institution => {
            const quantity = await redis.ft.search("idx:theses", `@institution_id:${institution.value.id} ${searchFilter}`)

            return {
                id: institution.value.id,
                name: institution.value.name,
                quantity: quantity.total,
                lat: Number.parseFloat((institution.value.coords as string).split(",")[1]), 
                lng: Number.parseFloat((institution.value.coords as string).split(",")[0])
            }
        }))

        res.send({
            finished: finishedStat,
            total: totalStat,
            thesesPerYear: Object.fromEntries(thesesPerYear),
            institutions: formattedInstitutions.filter(institution => institution.quantity > 0)
        })
    })
}
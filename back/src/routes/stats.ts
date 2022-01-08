import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { RedisClientType } from "../db/schema"

interface StatsReqQuery {
    year?: string,
    finished?: string,
    institution?: string
}

export default async function routes(app: FastifyInstance, { redis }: { redis: RedisClientType }) {
    app.get("/stats", async (req, res) => {
        const { year: yearStr, finished: finishedStr, institution } = req.query as StatsReqQuery

        if (yearStr !== undefined && isNaN(Number.parseInt(yearStr)) || finishedStr !== undefined && finishedStr !== "true" && finishedStr !== "false") res.status(StatusCodes.BAD_REQUEST).send()

        const year = yearStr ? Number.parseInt(yearStr) : undefined
        const finished = finishedStr !== undefined ? finishedStr === "true" : undefined

        const hasOptions = year !== undefined || finished !== undefined || institution !== undefined

        // institutions query

        const institutions = await redis.ft.search("idx:institutions", "*", {
            LIMIT: {
                from: 0,
                size: 10000 // there's only between 200 and 300 institutions in the dataset, so 10000 should be enough to get all of them even if it increases in the future
            }
        })

        if (institution && !institutions.documents.map(document => document.value.id).includes(institution)) return res.status(StatusCodes.NOT_FOUND).send()

        // theses query

        const optionalFinishedFilter = finished !== undefined ? `@finished:[${finished ? 1 : 0} ${finished ? 1 : 0}]` : ""
        const optionalYearFilter = year ? `@presentation_date:[${Date.UTC(year, 0, 1)} ${Date.UTC(year, 11, 31, 23, 59, 59)}]` : ""
        const optionalInstitutionFilter = institution ? `@institution_id:${institution}` : ""

        const searchFilter = optionalYearFilter + (optionalFinishedFilter ? (" " + optionalFinishedFilter) : "") + (optionalInstitutionFilter ? (" " + optionalInstitutionFilter) : "")

        const finishedStat = (await redis.ft.search("idx:theses", `@finished:[1 1] ${searchFilter}`)).total

        const totalStat = !hasOptions
            ? Number.parseInt((await redis.ft.info("idx:theses")).numDocs)
            : (await redis.ft.search("idx:theses", searchFilter)).total

        // theses per institutions repartition

        const formattedInstitutions = await Promise.all(institutions.documents.filter(i => i.value.id).map(async i => {
            const quantity = await redis.ft.search("idx:theses", `@institution_id:${i.value.id} ${searchFilter}`)

            return {
                id: i.value.id,
                name: i.value.name,
                quantity: quantity.total,
                // the coordinates are stored as `[lng],[lat]` because it allowed Redis to perform geo search by lat/lng/rad. I'm not using this anymore because there's MeiliSearch but it's still stored in this format anyway
                lat: Number.parseFloat((i.value.coords as string).split(",")[1]),
                lng: Number.parseFloat((i.value.coords as string).split(",")[0])
            }
        }))

        // theses per year repartition

        const minYear = 1970
        const maxYear = (new Date()).getFullYear()

        const thesesPerYear = new Map()

        for (let year = minYear; year <= maxYear; year++) {
            const yearBeginning = Date.UTC(year, 0, 1)
            const yearEnding = Date.UTC(year, 11, 31, 23, 59, 59)
            
            const quantity = await redis.ft.search("idx:theses", `@presentation_date:[${yearBeginning} ${yearEnding}] ${searchFilter}`)

            thesesPerYear.set(year, quantity.total)
        }

        res.send({
            finished: finishedStat,
            total: totalStat,
            thesesPerYear: Object.fromEntries(thesesPerYear),
            institutions: formattedInstitutions.filter(institution => institution.quantity > 0),
            exhaustiveInstitutions: institutions.documents.map(institution => ({ id: institution.value.id, name: institution.value.name })).filter(institution => institution.id !== undefined)
        })
    })
}
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

            thesesPerYear.set(year, quantity.total)
        }

        const institutions = await redis.ft.search("idx:institutions", "*", {
            LIMIT: {
                from: 0,
                size: 1000 // there's only between 200 and 300 institutions in the dataset, so 1000 should be fine to get all of them even if it increases in the future
            }
        })

        const formattedInstitutions = await Promise.all(institutions.documents.filter(institution => institution.value.id).map(async institution => {
            const quantity = await redis.ft.search("idx:theses", `@institution_id:${institution.value.id}`)

            return {
                id: institution.value.id,
                name: institution.value.name,
                quantity: quantity.total,
                lat: Number.parseFloat((institution.value.coords as string).split(",")[1]), 
                lng: Number.parseFloat((institution.value.coords as string).split(",")[0])
            }
        }))

        res.send({
            finished: finishedStat.total,
            total: Number.parseInt(thesesInfo.numDocs),
            thesesPerYear: Object.fromEntries(thesesPerYear),
            institutions: formattedInstitutions.filter(institution => institution.quantity > 0)
        })
    })
}
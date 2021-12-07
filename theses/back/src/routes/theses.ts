import { Express } from "express"
import { StatusCodes } from "http-status-codes"
import MeiliSearch from "meilisearch"

interface FinishedFilter {
    field: "finished"
    value: boolean
}

interface DateFilter {
    field: "year",
    value: number
}

module.exports = {
    setupRoute: (app: Express, meili: MeiliSearch) => {
        app.post("/theses", async (req, res) => {
            const { limit, query, offset, filters } = req.body as { limit: string | undefined, query: string | undefined, offset: string | undefined, filters: (FinishedFilter | DateFilter)[] | undefined }
    
            if (limit && (isNaN(Number.parseInt(limit)) || Number.parseInt(limit) < 0 || Number.parseInt(limit) > 20) && offset && (isNaN(Number.parseInt(offset)) || Number.parseInt(offset) < 0)) return res.sendStatus(StatusCodes.BAD_REQUEST)
    
            const thesesIndex = meili.index("theses")

            const meiliFilter = filters ? filters.map(filter => {
                if (filter.field === "finished") {
                    return "finished = " + filter.value.toString()
                }
                else /* if (filter.field === "presentation_date") */ {
                    return getDateFilterForYear(filter.value)
                }
            }).join(" AND ") : null

            const limitNumber = limit ? Number.parseInt(limit) : 20
            const offsetNumber = offset ? Number.parseInt(offset) * limitNumber : 0
            const results = await thesesIndex.search(query, {
                limit: 200,
                offset: offsetNumber,
                filter: meiliFilter ?? undefined
            })

            let finishedCount
    
            if (filters && filters.find(filter => filter.field === "finished" && filter.value === true)) {
                finishedCount = results.nbHits // we don't need to make an extra request to see how many are finished if we already asked for only those finished
            }
            else {
                finishedCount = (await thesesIndex.search(query, {
                    limit: 200,
                    filter: "finished = true" + (meiliFilter ? (" AND " + meiliFilter) : ""),
                })).nbHits // 200 is somehow arbitrary. It should in theory be 0, as we don't care about the results. But in practice, when the limit is too low, for a non identified reason, the search returns a nbHits way lower than the reality. This is VERY annoying and this applies for every search here
            }

            const minYear = 1970
            const maxYear = 2021
    
            const thesesPerYear = new Map()
    
            for (let currentYear = minYear; currentYear <= maxYear; currentYear++) {
                const thesesThisYear = (await thesesIndex.search(query, { limit: 100, filter: getDateFilterForYear(currentYear) })) // 200 instead of 500 as it's enough and a limit of 2000 in loop is very slow
                thesesPerYear.set(currentYear, thesesThisYear.nbHits)
            }
    
            results.hits = results.hits.slice(0, limitNumber)
            results.limit = limitNumber
            res.send({ nbFinished: finishedCount, thesesPerYear: Object.fromEntries(thesesPerYear), ...results })
        })
    }
}

function getDateFilterForYear(year: number) {
    const yearBeginning = Date.UTC(year, 0, 1)
    const yearEnding = Date.UTC(year, 11, 31, 23, 59, 59)

    return `presentation_date >= ${yearBeginning} AND presentation_date <= ${yearEnding}`
}
import express from "express"
import { MeiliSearch } from 'meilisearch'
import { StatusCodes } from "http-status-codes"
import dotenv from "dotenv"
import { exit } from "process"
import { importFromCsv } from "./db/import"

async function main() {
    dotenv.config()

    if (!process.env["MEILISEARCH_MASTER_KEY"]) {
        console.error("Missing the `MEILISEARCH_MASTER_KEY` environment variable (please specify it in the `.env` file)")
        exit(1)
    }
    
    const meili = new MeiliSearch({
        host: "http://127.0.0.1:7700",
        apiKey: process.env["MEILISEARCH_MASTER_KEY"]
    })

    await meili.health()
    const index = meili.index("theses")

    const port = 12000
    
    const app = express()
    app.use(express.json())
    
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
    
    app.get("/theses", async (req, res) => {
        const { limit, query } = req.query as { limit: string | undefined, query: string | undefined }

        if (query === undefined || (limit !== undefined && isNaN(Number.parseInt(limit)))) return res.sendStatus(StatusCodes.BAD_REQUEST)

        const results = await index.search(query, {
            /*
            
            The bigger the size of the results of the search, the slower the process.

            A small limit allow to restrict the search to less elements and results in a HUGE performance boost (e.g. for no query (return everything), with no limit the ~500 000 entries are returned and it takes ~10 seconds while with a limit of 1000 is takes only ~27 ms).

            An enormous limit doesn't mean it will always be slow: if the query matches only a small amount of documents, it results in the same performance boost because it's only a matter of number of matches returned. The limit only... limits the returned entries when it's too big.

            We could set a fairly reasonable limit and use the offset option to access the different pages way faster, but the front end will probably need all the data at once anyway to perform its stats on it.
            
            TODO : add an offset query parameter to allow pagination of results with MeiliSearch's offset option

            */
            limit: limit ? Number.parseInt(limit) : Number.MAX_SAFE_INTEGER // ⚠️ this means the result can be hundreds of Mo if it returns everything stored
        })

        res.send(results)
    })
    
    app.put("/import", async (req, res) => {
        const success = await importFromCsv("./res/complet.csv", index)
        if (success) res.sendStatus(StatusCodes.NO_CONTENT)
        else res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR)
    })
}

main()
import fastify from "fastify"
import cors from "fastify-cors"
import { createClient } from "redis"
import dotenv from "dotenv"
import { exit } from "process"
import { readdirSync } from "fs"
import MeiliSearch from "meilisearch"

async function main() {
    dotenv.config()

    if (!process.env["MEILISEARCH_AUTH"]) {
        console.error("Missing the `MEILISEARCH_AUTH` environment variable (please specify it in the `.env` file)")
        exit(1)
    }

    if (!process.env["MEILISEARCH_URL"]) {
        console.error("Missing the `MEILISEARCH_URL` environment variable (please specify it in the `.env` file)")
        exit(1)
    }
    
    if (!process.env["REDIS_AUTH"]) {
        console.error("Missing the `REDIS_AUTH` environment variable (please specify it in the `.env` file)")
        exit(1)
    }

    if (!process.env["REDIS_URL"]) {
        console.error("Missing the `REDIS_URL` environment variable (please specify it in the `.env` file)")
        exit(1)
    }

    const redis = createClient({
        url: process.env["REDIS_URL"],
        password: process.env["REDIS_AUTH"]
    })

    redis.on("error", err => console.error(err))
    await redis.connect()

    const meili = new MeiliSearch({
        host: process.env["MEILISEARCH_URL"],
        apiKey: process.env["MEILISEARCH_AUTH"]
    })

    await meili.health()

    const port = 12000
    
    const app = fastify()
    app.register(cors)
    
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
    
    for (const filename of readdirSync(__dirname + "/routes")) {
        app.register(require(__dirname + "/routes/" + filename), { redis, meili })
    }
}

main()
import fastify from "fastify"
import cors from "fastify-cors"
import { createClient } from "redis"
import dotenv from "dotenv"
import { exit } from "process"
import { readdirSync } from "fs"

async function main() {
    dotenv.config()

    if (!process.env["REDIS_AUTH"]) {
        console.error("Missing the `REDIS_AUTH` environment variable (please specify it in the `.env` file)")
        exit(1)
    }

    const redis = createClient({
        password: process.env["REDIS_AUTH"]
    })

    redis.on("error", err => console.error(err))
    await redis.connect()

    const port = 12000
    
    const app = fastify()
    app.register(cors)
    
    app.listen(port, () => {
        console.log(`Server started on port ${port}`)
    })
    
    for (const filename of readdirSync(__dirname + "/routes")) {
        app.register(require(__dirname + "/routes/" + filename), { redis })
    }
}

main()
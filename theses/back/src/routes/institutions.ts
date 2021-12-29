import { FastifyInstance } from "fastify"
import { StatusCodes } from "http-status-codes"
import { RedisClientType } from "../db/schema"

export default async function routes(app: FastifyInstance, { redis }: { redis: RedisClientType }) {
    app.get("/institutions", async (req, res) => {
        const { lat, lng, rad } = req.query as { lat: string | undefined, lng: string | undefined, rad: string | undefined }
    
        if (!lat || isNaN(Number.parseFloat(lat)) || !lng || isNaN(Number.parseFloat(lng)) || !rad || isNaN(Number.parseFloat(rad))) return res.status(StatusCodes.BAD_REQUEST).send()
    
        const institutions = await redis.ft.search("idx:institutions", `@coords:[${lng} ${lat} ${rad} m]`)

        res.send({
            ...institutions,
            documents: institutions.documents.map(doc => ({ id: doc.value.id, name: doc.value.name, lat: Number.parseFloat((doc.value.coords as string).split(",")[1]), lng: Number.parseFloat((doc.value.coords as string).split(",")[0]) }))
        })
    })
}
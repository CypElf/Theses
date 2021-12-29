import { createClient } from "redis"

export type RedisClientType = ReturnType<typeof createClient>

export interface These {
    authors: string[],
    authors_id: string[],
    title: string,
    directors: string[],
    directors_reversed: string[],
    directors_id: string[],
    presentation_institution: string | null,
    institution_id: string,
    domain: string,
    finished: number,
    inscription_date: string | null,
    presentation_date: string | null,
    language: string | null,
    these_id: string,
    available_online: number,
    upload_date: string | null,
    update_date: string | null
}

export interface Institution {
    id: string,
    name: string,
    coords: string
}
export interface These {
    id: string,
    authors: string[],
    authors_id: string[],
    title: string,
    directors: string[],
    directors_reversed: string[],
    directors_id: string[],
    presentation_institution: string | null,
    institution_id: string,
    domain: string,
    finished: boolean,
    inscription_date: string | null,
    presentation_date: string | null,
    language: string | null,
    these_id: string,
    available_online: boolean,
    upload_date: string | null,
    update_date: string | null
}

export interface ThesesQueryResult {
    hits: These[],
    nbHits: number,
    query: string,
    limit: number,
    offset: number,
}

export interface StatsQueryResult {
    finished: number,
    total: number,
    thesesPerYear: Map<number, number>,
    institutions: {
        id: string,
        name: string,
        quantity: number,
        lat: number,
        lng: number
    }[]
}

export interface InstitutionsQueryResult {
    institutions: {
        id: string,
        name: string
    }[]
}

export async function getExhaustiveInstitutions() {
    // @ts-ignore:next-line
    const result = await fetch(`${process.env.GATSBY_API_URL}/institutions`)
    const institutions: InstitutionsQueryResult = await result.json()
    return institutions
}
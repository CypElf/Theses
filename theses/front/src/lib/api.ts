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
    inscription_date: Date | null,
    presentation_date: Date | null,
    language: string | null,
    these_id: string,
    available_online: boolean,
    upload_date: Date | null,
    update_date: Date | null
}

export interface QueryResult {
    hits: These[],
    nbHits: number,
    exhaustiveNbHits: boolean,
    query: string,
    limit: number,
    offset: number,
    processingTimeMs : number,
    nbFinished: number,
    thesesPerYear: Map<number, number>
}

export const apiUrl = "http://localhost:12000"
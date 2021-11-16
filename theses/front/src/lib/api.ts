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
    presentation_date: Date,
    language: string | null,
    these_id: string,
    available_online: boolean,
    upload_date: string,
    update_date: string,
    lon: string | null,
    lat: string | null
}

export const apiUrl = "http://localhost:12000"
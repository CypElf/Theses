# API documentation

## GET /theses

Query parameters:
- query
- limit
- offset
- year
- finished

Return:

```ts
{
    hits: {
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
    }[],
    nbHits: number,
    query: string,
    limit: number,
    offset: number
}
```

## GET /institutions

Query parameters:
- lat
- lng
- rad

Return:

```ts
{
    total: number,
    documents: {
        name: string,
        lat: number,
        lng: number
    }[]
}
```

## GET /stats

Return:

```ts
{
    finished: number,
    total: number,
    thesesPerYear: {
        "1970": number,
        "1971": number,
        // ...
        "2021": number
    },
    institutions: {
        id: string,
        name: string,
        quantity: number,
        lat: number,
        lng: number
    }[]
}
```
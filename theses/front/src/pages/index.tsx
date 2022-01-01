import React, { Dispatch, SetStateAction, useState } from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import { Button, Container, FormControl, InputLabel, MenuItem, Pagination, Select, TextField } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import SearchIcon from "@mui/icons-material/Search"
import { apiUrl, ThesesQueryResult } from "../lib/api"

export default function Home() {
    const [query, setQuery] = useState("")
    const [year, setYear] = useState("none")
    const [finished, setFinished] = useState<boolean>()
    const [error, setError] = useState<string>()
    const [loading, setLoading] = useState(false)

    const [results, setResults] = useState<ThesesQueryResult>()

    const limit = 10
    const maxPage = results ? Math.ceil(results.nbHits / limit) : 0
    const currentPage = results ? results.offset / results.limit + 1 : 1

    return (
        <div className="flex justify-between">
            <div className="mx-auto mt-7 w-fit">
                <StaticImage className="mx-10" src="../img/theses.gif" alt="logo de theses.fr"/>
            </div>
            <div className="flex-1">
                <Container maxWidth="md">
                    <TextField label="Rechercher" margin="normal" fullWidth onChange={e => setQuery(e.target.value) } />
                </Container>


                <form className="w-1/3 flex justify-around items-center m-auto">
                    <FormControl>
                        <InputLabel id="finishedInput">Terminées ?</InputLabel>
                        <Select
                            label="Terminées ?"
                            labelId="finishedInput"
                            value={finished !== undefined ? (finished ? "true" : "false") : "none"}
                            onChange={e => {
                                setFinished(e.target.value === "none" ? undefined : e.target.value === "true")
                            }}
                        >
                            <MenuItem value="none">Peu importe</MenuItem>
                            <MenuItem value="true">Oui</MenuItem>
                            <MenuItem value="false">Non</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl>
                        <InputLabel id="yearInput">Année</InputLabel>
                        <Select
                            label="Année"
                            labelId="yearInput"
                            value={year}
                            onChange={e => {
                                if (typeof e.target.value === "string") setYear("none")
                                else setYear(e.target.value)
                            }}
                        >
                            <MenuItem value="none">Peu importe</MenuItem>
                            {[...[...Array((new Date()).getFullYear() - 1970)].keys()].map(i => i + 1970).map(year => {
                                return <MenuItem key={year} value={year}>{year}</MenuItem>
                            })}
                        </Select>
                    </FormControl>

                    <LoadingButton variant="contained" endIcon={<SearchIcon/>} size="large" loading={loading} loadingPosition="end" onClick={e => {
                        executeRequest(query, limit, 0, year === "none" ? undefined: Number.parseInt(year), finished, setResults, setError, setLoading)
                    }}>
                        Rechercher
                    </LoadingButton>
                </form>
                <Link to="/stats">Go to the stats page</Link>
                {error && <p className="text-2xl text-center text-red-800">{error}</p>}

                {results && <div>
                    <div className="flex justify-between m-3 mr-10">
                        <h1 className="text-xl">{results.nbHits} résultats {results.query.length > 0 && <>pour <span className="text-theses-blue">{results.query}</span></>}</h1>
                    </div>
                    {results.hits.map(these => {
                        return (<div key={these.id} className="m-3 p-3 bg-theses-light-blue rounded-lg ">
                            {
                                these.available_online ?
                                    <a href={`https://theses.fr/${these.these_id}/document`}>{these.title}</a>
                                : these.title
                            }
                            <br/>
                            <span className="text-sm mt-3">Thèse de <span className="text-theses-blue">{these.authors.join(", ")}</span>, supervisée par <span className="text-theses-blue">{these.directors.join(", ")}</span>
                            {these.presentation_date &&
                                <span> et soutenue le <span className="text-theses-blue">{these.presentation_date}</span></span>
                            }
                            </span>
                        </div>)
                    })}

                    <div className="mb-10 mt-5">
                        <Pagination color="primary" count={maxPage} page={currentPage} onChange={(e, value) => executeRequest(query, limit, value - 1, year === "none" ? undefined: Number.parseInt(year), finished, setResults, setError, setLoading)}/>
                    </div>
                </div>}
            </div>
        </div>
    )
}

async function executeRequest(query: string, limit: number, offset: number, year: number | undefined, finished: boolean | undefined, setResults: Dispatch<SetStateAction<ThesesQueryResult>>, setError: Dispatch<SetStateAction<string | null>>, setLoading: Dispatch<SetStateAction<boolean>>) {
    setLoading(true)
    let data: ThesesQueryResult
    try {
        let url = `${apiUrl}/theses?query=${query}&limit=${limit}&offset=${offset}`
        if (year !== undefined) url += `&year=${year}`
        if (finished !== undefined) url += `&finished=${finished}`

        const result = await fetch(url)
        data = await result.json()
    }
    catch {
        setResults(undefined)
        setLoading(false)
        return setError("The request to the API failed.")
    }

    setError(null)

    console.log(data)

    data.hits = data.hits.map(these => {
        if (these.inscription_date) {
            these.inscription_date = getFormattedDate(new Date(these.inscription_date))
        }
        if (these.presentation_date) {
            these.presentation_date = getFormattedDate(new Date(these.presentation_date))
        }
        if (these.upload_date) {
            these.upload_date = getFormattedDate(new Date(these.upload_date))
        }
        if (these.update_date) {
            these.update_date = getFormattedDate(new Date(these.update_date))
        }

        return these
    })

    setResults(data)
    console.log(data)
    setLoading(false)
}

function getFormattedDate(date: Date) {
    return date.toISOString().substring(0, 10).split("-").reverse().join("/")
}
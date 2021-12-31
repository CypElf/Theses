import React, { Dispatch, SetStateAction, useState } from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import { apiUrl, ThesesQueryResult } from "../lib/api"

export default function Home() {
    const [query, setQuery] = useState("")
    const [year, setYear] = useState<number>()
    const [finished, setFinished] = useState<boolean>()
    const [error, setError] = useState<string>()

    const [results, setResults] = useState<ThesesQueryResult>()

    const limit = 10
    const maxPage = results ? Math.ceil(results.nbHits / limit) : 0
    const currentPage = results ? results.offset / results.limit + 1 : 1

    return (<>
        <form className="flex justify-center items-center my-8">
            <StaticImage className="mr-10" src="../img/theses.gif" alt="logo de theses.fr"/>
            <input className="border-2 border-theses-blue rounded-xl px-3 py-2 mr-5 w-96 text-lg" onChange={e => setQuery(e.target.value) } type="text" id="query" name="query"></input>
            
            <label className="m-2" htmlFor="year">Year filter:</label> <input className="border-2 p-2 m-1" id="year" name="year" type="number" value={year} onChange={e => {
                if (!isNaN(Number.parseInt(e.target.value))) {
                    setYear(Number.parseInt(e.target.value))
                }
                else if (e.target.value === "") setYear(undefined)
            }}/>
            <label className="m-2" htmlFor="finished">Finished filter: </label>
            <select className="p-1 m-2" name="finished" id="finished" value={finished !== undefined ? (finished ? "true" : "false") : "none"} onChange={e => {
                setFinished(e.target.value === "none" ? undefined : e.target.value === "true")
            }}>
                <option value="none">-- aucune sélection --</option>
                <option value="true">oui</option>
                <option value="false">non</option>
            </select>

            <button className="bg-theses-blue rounded-lg text-white px-4 py-2" onClick={e => {
                e.preventDefault()
                executeRequest(query, limit, 0, year, finished, setResults, setError)
            }}>
                Rechercher
            </button>
        </form>
        <Link to="/stats">Go to the stats page</Link>
        {error && <p className="text-2xl text-center text-red-800">{error}</p>}

        {results && <div>
            <div className="flex justify-between m-3 mr-10">
                <h1 className="text-xl">{results.nbHits} résultats {results.query.length > 0 && <>pour <span className="text-theses-blue">{results.query}</span></>}</h1>
                {
                    <nav>

                    {currentPage > 1 && <a className="cursor-pointer" onClick={e => executeRequest(query, limit, currentPage - 2, year, finished, setResults, setError)}>{currentPage - 1}</a>}
                    <a className="cursor-pointer text-xl text-theses-blue mx-3">{currentPage}</a>
                    {currentPage < maxPage && <a className="cursor-pointer" onClick={e => executeRequest(query, limit, currentPage, year, finished, setResults, setError)}>{currentPage + 1}</a>}

                    </nav>
                }
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
        </div>}
    </>)
}

async function executeRequest(query: string, limit: number, offset: number, year: number | undefined, finished: boolean | undefined, setResults: Dispatch<SetStateAction<ThesesQueryResult>>, setError: Dispatch<SetStateAction<string | null>>) {
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
}

function getFormattedDate(date: Date) {
    return date.toISOString().substring(0, 10).split("-").reverse().join("/")
}
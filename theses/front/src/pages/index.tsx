import Highcharts from "highcharts"
import HighchartsMap from "highcharts/modules/map"
import France from "@highcharts/map-collection/countries/fr/fr-all.geo.json"
import proj4 from "proj4"
import HighchartsReact from "highcharts-react-official"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { StaticImage } from "gatsby-plugin-image"
import { apiUrl, QueryResult, These } from "../lib/api"

HighchartsMap(Highcharts)

if (window !== undefined) {
    (window as any).proj4 = (window as any).proj4 || proj4
}

export default function Home() {
    const [query, setQuery] = useState("")
    const [year, setYear] = useState<number>()
    const [finished, setFinished] = useState<boolean>()
    const [error, setError] = useState<string>()

    const [results, setResults] = useState<QueryResult>()
    const [institutions, setInstitutions] = useState()

    const [mapChart, setMapChart] = useState<object>()
    const [pieChart, setPieChart] = useState<object>()
    let [splineChart, setSplineChart] = useState<object>()

    const limit = 10
    const maxPage = results ? Math.ceil(results.nbHits / limit) : 0
    const currentPage = results ? results.offset / results.limit + 1 : 1

    useEffect(() => {
        if (results) {
            setPieChart({
                chart: {
                    type: "pie"
                },
                title: {
                    text: "Thèses terminées"
                },
                accessibility: {
                    announceNewData: {
                        enabled: true
                    },
                    point: {
                        valueSuffix: "%"
                    }
                },
                plotOptions: {
                    series: {
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}: {point.y:.1f}%'
                        },
                        events: {
                            click: ({ point: { name } }) => {
                                setFinished(name === "Terminées")
                                executeRequest(query, limit, 0, year, name === "Terminées", setResults, setError)
                            }
                        }
                    }
                },
    
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'
                },
    
                series: [
                    {
                        name: "Thèses",
                        colorByPoint: true,
                        data: [
                            {
                                name: "Non terminées",
                                y: (results.nbHits - results.nbFinished) / results.nbHits * 100,
                                drilldown: "Chrome"
                            },
                            {
                                name: "Terminées",
                                y: results.nbFinished / results.nbHits * 100,
                                drilldown: "Terminées"
                            }
                        ]
                    }
                ],
                credits: {
                    enabled: false
                }
            })
            
            setSplineChart({
                chart: {
                    type: 'areaspline'
                },
                title: {
                    text: 'Thèses publiées au fil des années'
                },
                legend: {
                    layout: 'vertical',
                    align: 'left',
                    verticalAlign: 'top',
                    x: 150,
                    y: 100,
                    floating: true,
                    borderWidth: 1,
                    backgroundColor:
                        '#FFFFFF'
                },
                xAxis: {
                    categories: [...results.thesesPerYear.keys()]
                },
                yAxis: {
                    title: {
                        text: 'Nombre de thèses'
                    }
                },
                tooltip: {
                    shared: true,
                    valueSuffix: ' units'
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    areaspline: {
                        fillOpacity: 0.5
                    },
                    series: {
                        events: {
                            click: ({ point: { category } }) => {
                                setYear(category)
                                executeRequest(query, limit, 0, category, finished, setResults, setError)
                            }
                        }
                    }
                },
                series: [{
                    name: 'Thèses',
                    data: [...results.thesesPerYear.values()]
                }]
            })

            setMapChart({
                chart: {
                    map: "countries/fr/fr-all"
                },
                title: {
                    text: "Répartition des thèses en France"
                },
                mapNavigation: {
                    enabled: true,
                    buttonOptions: {
                        verticalAlign: 'bottom'
                    }
                },
                colorAxis: {
                    min: 0
                },
                series: [{
                    name: "France",
                    mapData: France,
                    borderColor: "#A0A0A0",
                    nullColor: "rgba(200, 200, 200, 0.3)",
                    showInLegend: false
                }, {
                    name: "Thèses",
                    type: "mappoint",
                    data: [{
                        name: "Paris",
                        lat: 48.856614,
                        lon: 2.3522219
                    }],
                    showInLegend: false,
                    enableMouseTracking: false
                }]
            })
        }
    }, [results, query, year, finished])

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
        {error && <p className="text-2xl text-center text-red-800">{error}</p>}

        {results && pieChart && splineChart &&
        <div className="grid grid-cols-3">
            <div className="col-span-2">
                <h1 className="ml-10 text-xl">Statistiques sur ces thèses</h1>
                <div className="grid grid-cols-2">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={pieChart}
                    />
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={pieChart}
                    />
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={splineChart}
                />
                <HighchartsReact
                    constructorType="mapChart"
                    highcharts={Highcharts}
                    options={mapChart}
                />
            </div>
            <div>
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
            </div>
        </div>}
    </>)
}

async function executeRequest(query: string, limit: number, offset: number, year: number | undefined, finished: boolean | undefined, setResults: Dispatch<SetStateAction<QueryResult>>, setError: Dispatch<SetStateAction<string | null>>) {
    let data: QueryResult
    try {
        const result = await fetch(`${apiUrl}/theses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query,
                limit,
                offset,
                year,
                finished
            })
        })
        data = await result.json()
    }
    catch {
        setResults(undefined)
        return setError("A server error occured.")
    }

    setError(null)

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

    data.thesesPerYear = new Map(Object.entries(data.thesesPerYear).map(([k, v]) => [Number.parseInt(k), v]))

    setResults(data)
    console.log(data)
}

function getFormattedDate(date: Date) {
    return date.toISOString().substring(0, 10).split("-").reverse().join("/")
}
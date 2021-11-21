import Hightcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { StaticImage } from "gatsby-plugin-image"
import { apiUrl, QueryResult, These } from "../lib/api"

export default function Home() {
    const [query, setQuery] = useState("")
    const [error, setError] = useState<string>()

    const [results, setResults] = useState<QueryResult>()

    const [pieChart, setPieChart] = useState<object>()
    let [splineChart, setSplineChart] = useState<object>()

    const limit = 10
    const maxPage = results ? Math.ceil(results.nbHits / limit) : 0
    const currentPage = results ? results.offset / results.limit + 1 : 1

    // let mapOptions = null

    // useEffect(() => {
    //     (async () => {
    //         if (data) {
    //             const mappedWithLonLat = await Promise.all(data.map(async these => {
    //                 const res = await fetch(`https://data.enseignementsup-recherche.gouv.fr/api/records/1.0/search/?dataset=fr-esr-principaux-etablissements-enseignement-superieur&rows=10&fileds=identifiant_idref&fields=identifiant_idref,coordonnees&q=${these.institution_id}`)
    //                 const institution_data = await res.json()
    //                 console.log(institution_data)
    //                 these.lon = institution_data.records?.[0]?.fields?.coordonnees?.[0]
    //                 these.lat = institution_data.records?.[0]?.fields?.coordonnees?.[1]
    //                 return these
    //             }))
    //         }
    //     })()
    // }, [data])*

    useEffect(() => {
        executeRequest(query, limit, 0, setResults, setError)
    }, [query])

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
                                y: results.hits.filter(these => !these.finished).length / results.hits.length * 100,
                                drilldown: "Chrome"
                            },
                            {
                                name: "Terminées",
                                y: results.hits.filter(these => these.finished).length / results.hits.length * 100,
                                drilldown: "Terminées"
                            }
                        ]
                    }
                ],
                credits: {
                    enabled: false
                }
            })
    
            const dates = results.hits.map(these => these.presentation_date).filter(t => t != null)
            const years = [...new Set(dates.map(date => date.getFullYear()).filter(date => !isNaN(date)))].sort((a, b) => a - b)
            const thesesPerYear = years.map(year => results.hits.filter(these => these.presentation_date?.getFullYear() === year).length)
            console.log(thesesPerYear)
    
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
                    categories: years
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
                    }
                },
                series: [{
                    name: 'Thèses',
                    data: thesesPerYear
                }]
            })
    
            // mapOptions = {
            //     chart: {
            //         map: "countries/fr/"
            //     },
            
            //     title: {
            //         text: 'Thèses par région'
            //     },
            
            //     subtitle: {
            //         text: 'Source map: <a href="http://code.highcharts.com/mapdata/countries/fr/fr-all.js">France</a>'
            //     },
            
            //     mapNavigation: {
            //         enabled: true,
            //         buttonOptions: {
            //             verticalAlign: 'bottom'
            //         }
            //     },
            
            //     colorAxis: {
            //         min: 0
            //     },
            
            //     series: [{
            //         name: 'Thèses',
            //         type: 'mappoint',
            //         data: data.map(these => these.institution_id),
            //         color: 'silver',
            //         nullColor: 'silver',
            //         showInLegend: false,
            //         enableMouseTracking: false
            //     }]
            // }
        }
    }, [results])

    return (<>
    <div className="flex justify-center my-8">
        <StaticImage className="mr-10" src="../img/theses.gif" alt="logo de theses.fr"/>
        <input className="border-2 border-theses-blue rounded-xl px-3 py-2 mr-5 w-96 text-lg" onChange={e => setQuery(e.target.value) } type="text" id="query" name="query"></input>
    </div>
        {error && <p className="text-2xl text-center text-red-800">{error}</p>}

        {results && pieChart && splineChart &&
        <div className="grid grid-cols-3">
            <div className="col-span-2">
                <h1 className="ml-10 text-xl">Statistiques sur ces thèses</h1>
                <div className="grid grid-cols-2">
                    <HighchartsReact
                        highcharts={Hightcharts}
                        options={pieChart}
                    />
                    <HighchartsReact
                        highcharts={Hightcharts}
                        options={pieChart}
                    />
                </div>
                <HighchartsReact
                    highcharts={Hightcharts}
                    options={splineChart}
                />
            </div>
            <div>
                <h1 className="text-xl">{results.nbHits} résultats {results.query.length > 0 && `pour ${results.query}`}</h1>
                {
                    <nav>

                    {currentPage > 1 && <a className="cursor-pointer" onClick={e => executeRequest(query, limit, currentPage - 2, setResults, setError)}>{currentPage - 1}</a>}
                    <a className="cursor-pointer text-xl text-theses-blue mx-3">{currentPage}</a>
                    {currentPage < maxPage && <a className="cursor-pointer" onClick={e => executeRequest(query, limit, currentPage, setResults, setError)}>{currentPage + 1}</a>}

                    </nav>
                }
                {results.hits.map(these => {
                    return (<div key={these.id} className="m-3">
                        {these.title} de {these.authors.join(", ")}
                    </div>)
                })}
            </div>
        </div>}
    </>)
}

async function executeRequest(query: string, limit: number, offset: number, setResults: Dispatch<SetStateAction<QueryResult>>, setError: Dispatch<SetStateAction<string | null>>) {
    console.log(offset)
    
    let data
    try {
        const result = await fetch(`${apiUrl}/theses?query=${query}&limit=${limit}&offset=${offset}`)
        data = await result.json()
    }
    catch {
        setResults(undefined)
        return setError("A server error occured.")
    }

    setError(null)

    data.hits = data.hits.map(these => {
        if (these.presentation_date) {
            const [day, month, year] = these.presentation_date.split("-")
            these.presentation_date = new Date(Date.UTC(year, month - 1, day))
        }

        return these
    })

    setResults(data)

    console.log(data)
}
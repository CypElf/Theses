import Hightcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { apiUrl, These } from "../lib/api"

export default function Home() {
    const [query, setQuery] = useState("")
    const [limit, setLimit] = useState("")
    const [error, setError] = useState<string>()

    const [data, setData] = useState<These[]>()

    const [pieChart, setPieChart] = useState<object>()
    let [splineChart, setSplineChart] = useState<object>()
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
    // }, [data])

    useEffect(() => {
        if (data) {
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
                                y: data.filter(these => !these.finished).length / data.length * 100,
                                drilldown: "Chrome"
                            },
                            {
                                name: "Terminées",
                                y: data.filter(these => these.finished).length / data.length * 100,
                                drilldown: "Terminées"
                            }
                        ]
                    }
                ]
            })
    
            const dates = data.map(these => these.presentation_date).filter(t => t != null)
            const years = [...new Set(dates.map(date => date.getFullYear()).filter(date => !isNaN(date)))].sort((a, b) => a - b)
            const thesesPerYear = years.map(year => data.filter(these => these.presentation_date?.getFullYear() === year).length)
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
    }, [data])
    
    return (<>
        <form onSubmit={e => executeRequest(e, query, limit, setData, setError)} method="POST">
            <label htmlFor="query">Query: </label>
            <input className="border-2 p-1 m-2" onChange={e => setQuery(e.target.value)} type="text" id="query" name="query"></input><br />
            <label htmlFor="query">Limit: </label>
            <input className="border-2 p-1 m-2" onChange={e => setLimit(e.target.value)} type="text" id="limit" name="limit"></input><br />
            <button className="border-2 p-1 m-2">Search</button>
        </form>

        {error && <p>{error}</p>}

        {data && pieChart && splineChart && <>
            <HighchartsReact
                highcharts={Hightcharts}
                options={pieChart}
            />
            <HighchartsReact
                highcharts={Hightcharts}
                options={splineChart}
            />
        </>}
    </>)
}

async function executeRequest(e: React.FormEvent<HTMLFormElement>, query: string, limit: string, setData: Dispatch<SetStateAction<These[]>>, setError: Dispatch<SetStateAction<string | null>>) {
    e.preventDefault()
    let data
    try {
        const result = await fetch(`${apiUrl}/theses?query=${query}&limit=${limit}`)
        data = await result.json()
    }
    catch {
        return setError("A server error occured.")
    }

    setError(null)

    const datedData = data.hits.map(these => {
        if (these.presentation_date) {
            const [day, month, year] = these.presentation_date.split("-")
            these.presentation_date = new Date(Date.UTC(year, month - 1, day))
        }

        return these
    })

    setData(datedData)

    console.log(data)
}
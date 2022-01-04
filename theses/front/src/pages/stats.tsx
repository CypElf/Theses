import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import Highcharts from "highcharts"
import HighchartsMap from "highcharts/modules/map"
import France from "@highcharts/map-collection/countries/fr/fr-all.geo.json"
import proj4 from "proj4"
import HighchartsReact from "highcharts-react-official"
import { apiUrl, StatsQueryResult } from "../lib/api"
import Layout from "../components/layout"

HighchartsMap(Highcharts)

if (window !== undefined) {
    (window as any).proj4 = (window as any).proj4 || proj4
}

export default function Stats() {
    const [year, setYear] = useState<number>()
    const [finished, setFinished] = useState<boolean>()
    const [error, setError] = useState<string>()

    const [stats, setStats] = useState<StatsQueryResult>()

    const [mapChart, setMapChart] = useState<object>()
    const [pieChart, setPieChart] = useState<object>()
    const [splineChart, setSplineChart] = useState<object>()

    useEffect(() => {
        if (stats) {
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
                                executeRequest(setStats, setError, year, name === "Terminées")
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
                                y: (stats.total - stats.finished) / stats.total * 100,
                                drilldown: "Chrome"
                            },
                            {
                                name: "Terminées",
                                y: stats.finished / stats.total * 100,
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
                    categories: [...stats.thesesPerYear.keys()]
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
                                executeRequest(setStats, setError, category, finished)
                            }
                        }
                    }
                },
                series: [{
                    name: 'Thèses',
                    data: [...stats.thesesPerYear.values()]
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
                    enabled: true
                },
            
                tooltip: {
                    headerFormat: "",
                    pointFormat: "<b>{point.name}</b><br>Nombre de thèses soutenues ici : {point.quantity}"
                },
            
                series: [{
                    name: "France",
                    mapData: France,
                    borderColor: "#A0A0A0",
                    nullColor: "rgba(200, 200, 200, 0.3)",
                    showInLegend: false
                }, {
                    name: "Separators",
                    type: "mapline",
                    nullColor: "#707070",
                    showInLegend: false,
                    enableMouseTracking: false
                }, {
                    type: "mappoint",
                    name: "Cities",
                    color: Highcharts.getOptions().colors[1],
                    data: stats.institutions.map(institution => ({
                        name: institution.name,
                        lat: institution.lat,
                        lon: institution.lng,
                        quantity: institution.quantity
                    })),
                }]})
        }
    }, [stats, year, finished])

    return (
        <Layout>
            <form className="flex justify-center items-center my-8">                
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
                    executeRequest(setStats, setError, year, finished)
                }}>
                    Rechercher
                </button>
            </form>
            {error && <p className="text-2xl text-center text-red-800">{error}</p>}

            {stats && pieChart && splineChart &&
                <div>
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
                </div>}
        </Layout>
    )
}

async function executeRequest(setResults: Dispatch<SetStateAction<StatsQueryResult>>, setError: Dispatch<SetStateAction<string | null>>, year?: number, finished?: boolean ) {
    let data: StatsQueryResult
    try {
        let url = `${apiUrl}/stats`
        if (year !== undefined) url += `?year=${year}`
        if (finished !== undefined) {
            if (year) url += `&finished=${finished}`
            else url += `?finished=${finished}`
        }

        const result = await fetch(url)
        data = await result.json()
    }
    catch {
        setResults(undefined)
        return setError("A server error occured.")
    }

    setError(null)
    
    setResults({
        ...data,
        thesesPerYear: new Map(Object.entries(data.thesesPerYear).map(([k, v]) => [Number.parseInt(k), v]))
    })
    console.log(data)
}

function getFormattedDate(date: Date) {
    return date.toISOString().substring(0, 10).split("-").reverse().join("/")
}
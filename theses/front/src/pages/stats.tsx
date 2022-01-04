import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
// import "leaflet/dist/leaflet.css"
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import SearchIcon from "@mui/icons-material/Search"
import { apiUrl, StatsQueryResult } from "../lib/api"
import Layout from "../components/layout"
import { Helmet } from "react-helmet"

export default function Stats() {
    const [year, setYear] = useState("none")
    const [finished, setFinished] = useState<boolean>()
    const [error, setError] = useState<string>()
    const [loading, setLoading] = useState(false)

    const [stats, setStats] = useState<StatsQueryResult>()

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
                                executeRequest(setStats, setError, setLoading, year === "none" ? undefined : Number.parseInt(year), name === "Terminées")
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
                                executeRequest(setStats, setError, setLoading, category, finished)
                            }
                        }
                    }
                },
                series: [{
                    name: 'Thèses',
                    data: [...stats.thesesPerYear.values()]
                }]
            })
        }
    }, [stats, year, finished])

    return (
        <Layout>
            <Helmet>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
                    integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
                    crossOrigin=""/>
            </Helmet>
            <form className="flex justify-center items-center my-8 gap-10">
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
                        {[...[...Array((new Date()).getFullYear() - 1970)].keys()].reverse().map(i => i + 1970).map(year => {
                            return <MenuItem key={year} value={year}>{year}</MenuItem>
                        })}
                    </Select>
                </FormControl>

                <LoadingButton type="submit" variant="contained" endIcon={<SearchIcon />} size="large" loading={loading} loadingPosition="end" onClick={e => {
                    executeRequest(setStats, setError, setLoading, year === "none" ? undefined : Number.parseInt(year), finished)
                }}>
                    Rechercher
                </LoadingButton>
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

                    <MapContainer center={[46.95, 2.95]} zoom={6} scrollWheelZoom={false}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {stats.institutions.map(institution => {
                            return (
                                <Marker key={institution.id} position={[institution.lat, institution.lng]}>
                                    <Popup>
                                        {institution.name} : {institution.quantity} thèses
                                    </Popup>
                                </Marker>
                            )
                        })}
                    </MapContainer>
                </div>}
        </Layout>
    )
}

async function executeRequest(setResults: Dispatch<SetStateAction<StatsQueryResult>>, setError: Dispatch<SetStateAction<string | null>>, setLoading: Dispatch<SetStateAction<boolean>>, year?: number, finished?: boolean) {
    setLoading(true)
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
        setLoading(false)
        return setError("A server error occured.")
    }

    setError(null)

    setResults({
        ...data,
        thesesPerYear: new Map(Object.entries(data.thesesPerYear).map(([k, v]) => [Number.parseInt(k), v]))
    })
    console.log(data)
    setLoading(false)
}
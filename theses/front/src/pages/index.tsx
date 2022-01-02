import React, { Dispatch, SetStateAction, useState } from "react"
import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import { Button, Card, CardActions, CardContent, Container, Divider, FormControl, InputLabel, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Pagination, Select, TextField, Typography } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import SearchIcon from "@mui/icons-material/Search"
import SchoolIcon from "@mui/icons-material/School"
import QueryStatsIcon from "@mui/icons-material/QueryStats"
import InfoIcon from "@mui/icons-material/Info"
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
            <div className="mx-auto mt-7 w-fit h-fit sticky top-7">
                <StaticImage className="mx-10" src="../img/theses.gif" alt="logo de theses.fr" />

                <div className="mx-auto mt-16 w-64 font-bold">Thèses</div>
                <List>
                    <ListItem sx={{ m: "auto", width: 256 }}>
                        <ListItemButton className="rounded-lg hover:bg-blue-100" component={Link} to="/">
                            <ListItemIcon>
                                <SchoolIcon />
                            </ListItemIcon>
                            <ListItemText primary="Parcourir" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem sx={{ m: "auto", width: 256 }}>
                        <ListItemButton className="rounded-lg hover:bg-blue-100" component={Link} to="/stats">
                            <ListItemIcon>
                                <QueryStatsIcon />
                            </ListItemIcon>
                            <ListItemText primary="Statistiques" />
                        </ListItemButton>
                    </ListItem>
                </List>

                <Divider sx={{ mx: 4 }} />

                <div className="mx-auto mt-7 w-64 font-bold">Autres</div>
                <List>
                    <ListItem sx={{ m: "auto", width: 256 }}>
                        <ListItemButton className="rounded-lg hover:bg-blue-100" component={Link} to="/about">
                            <ListItemIcon>
                                <InfoIcon />
                            </ListItemIcon>
                            <ListItemText primary="A propos" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </div>
            <div className="flex-1">
                <form>
                    <Container maxWidth="md">
                        <TextField label="Rechercher" margin="normal" fullWidth onChange={e => setQuery(e.target.value)} />
                    </Container>

                    <div className="w-1/3 flex justify-around items-center m-auto">
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
                            executeRequest(query, limit, 0, year === "none" ? undefined : Number.parseInt(year), finished, setResults, setError, setLoading)
                        }}>
                            Rechercher
                        </LoadingButton>
                    </div>
                </form>
                {error && <p className="text-2xl text-center text-red-800">{error}</p>}

                {results && <div>
                    <div className="flex justify-between m-3 mr-10">
                        <h1 className="text-xl">{results.nbHits} résultats {results.query.length > 0 && <>pour <span className="text-theses-blue">{results.query}</span></>}</h1>
                    </div>
                    {results.hits.map(these => {
                        return (
                            <Card key={these.id} sx={{ mr: 15, my: 5 }}>
                                <CardContent>
                                    <Typography fontSize={20} component="div" gutterBottom>
                                        {these.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" component="div">
                                        Thèse de {these.authors.join(", ")} supervisée par {these.directors.join(", ")} {these.presentation_date &&
                                        <> et soutenue le {these.presentation_date}</>
                                    }
                                    </Typography>
                                </CardContent>
                                {
                                    these.available_online && <CardActions>
                                        <Button size="small"><a href={`https://theses.fr/${these.these_id}/document`}>Consulter en ligne</a></Button>
                                    </CardActions>
                                }
                            </Card>
                        )
                    })}

                    <div className="mb-10 mt-5">
                        <Pagination color="primary" count={maxPage} page={currentPage} onChange={(e, value) => executeRequest(query, limit, value - 1, year === "none" ? undefined : Number.parseInt(year), finished, setResults, setError, setLoading)} />
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
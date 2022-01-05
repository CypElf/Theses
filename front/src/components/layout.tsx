import React, { useContext, useEffect } from "react"
import { graphql, Link, useStaticQuery } from "gatsby"
import { GatsbyImage, getImage } from "gatsby-plugin-image"
import { Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material"
import SchoolIcon from "@mui/icons-material/School"
import QueryStatsIcon from "@mui/icons-material/QueryStats"
import InfoIcon from "@mui/icons-material/Info"
import { darkTheme, lightTheme, darkModeContext } from "./theme"
import { ThemeProvider } from "@mui/material"

export default function Layout({ children }) {
    const DarkModeContext = useContext(darkModeContext)
    const { darkMode, setDarkMode } = DarkModeContext

    const data = useStaticQuery(graphql`
        query {
            allImageSharp {
                nodes {
                    gatsbyImageData
                    resize {
                        originalName
                    }
                }
            }
        }
    `)

    const lightLogo = data.allImageSharp.nodes.find(node => node.resize.originalName === "theses_white.png")
    const darkLogo = data.allImageSharp.nodes.find(node => node.resize.originalName === "theses_black.png")

    useEffect(() => {
        const theme = localStorage.getItem("preferred-theme")
        if (theme) {
            const themePreference = localStorage.getItem("preferred-theme")
            if (themePreference === "dark") {
                setDarkMode(true)
            } else {
                setDarkMode(false)
            }
        } else {
            localStorage.setItem("preferred-theme", "light")
            setDarkMode(true)
        }
    }, [])

    console.log("data:", data)

    return (
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
            <div className={`flex min-h-screen h-full justify-between ${darkMode ? "bg-theses-dark-blue text-white" : ""}`}>
                <div className="mx-auto mt-7 w-fit h-fit sticky top-7">
                    <GatsbyImage className="mx-10" image={darkMode ? lightLogo.gatsbyImageData : darkLogo.gatsbyImageData} alt="logo de theses.fr" />

                    <div className="mx-auto mt-16 w-64 font-bold">Thèses</div>
                    <List className={darkMode ? "text-gray-300" : ""}>
                        <ListItem sx={{ m: "auto", width: 256 }}>
                            <ListItemButton className={`rounded-lg ${!darkMode ? "hover:bg-blue-100" : ""}`} component={Link} to="/">
                                <ListItemIcon>
                                    <SchoolIcon/>
                                </ListItemIcon>
                                <ListItemText primary="Parcourir"/>
                            </ListItemButton>
                        </ListItem>
                        <ListItem sx={{ m: "auto", width: 256 }}>
                            <ListItemButton className={`rounded-lg ${!darkMode ? "hover:bg-blue-100" : ""}`} component={Link} to="/stats">
                                <ListItemIcon>
                                    <QueryStatsIcon/>
                                </ListItemIcon>
                                <ListItemText primary="Statistiques"/>
                            </ListItemButton>
                        </ListItem>
                    </List>

                    <Divider sx={{ mx: 4 }} />

                    <div className="mx-auto mt-7 w-64 font-bold">Autres</div>
                    <List className={darkMode ? "text-gray-300" : ""}>
                        <ListItem sx={{ m: "auto", width: 256 }}>
                            <ListItemButton className={`rounded-lg ${!darkMode ? "hover:bg-blue-100" : ""}`} component={Link} to="/about">
                                <ListItemIcon>
                                    <InfoIcon />
                                </ListItemIcon>
                                <ListItemText primary="A propos" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </div>
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </ThemeProvider>
    )
}
import "./src/styles/global.css"
import "@fontsource/roboto/300.css"
import "@fontsource/roboto/400.css"
import "@fontsource/roboto/500.css"
import "@fontsource/roboto/700.css"

import React from "react"

import DarkModeState from "./src/components/theme"

export function wrapRootElement({ element, props }) {
    return <DarkModeState {...props}>{element}</DarkModeState>
}
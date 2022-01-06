import React from "react"

import DarkModeState from "./src/components/theme"

export function wrapRootElement({ element, props }) {
    return <DarkModeState {...props}>{element}</DarkModeState>
}
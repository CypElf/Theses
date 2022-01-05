import React, { createContext, useReducer } from "react"
import { createTheme } from "@mui/material"

export const lightTheme = createTheme({
    palette: {
        mode: "light"
    }
})

export const darkTheme = createTheme({
    palette: {
        mode: "dark"
    }
})

let SET_THEME

export const darkModeContext = createContext()

export const darkModeReducer = (state, action) => {
    switch (action.type) {
        case SET_THEME:
            return {
                ...state,
                darkMode: action.payload
            }
        default:
            return state
    }
}

export default function DarkModeState({ children }) {
    const initialState = {
        darkMode: "false"
    }
    const [state, dispatch] = useReducer(darkModeReducer, initialState)

    const setDarkMode = async bool => {
        dispatch({
            type: SET_THEME,
            payload: bool
        })
    }

    return (
        <darkModeContext.Provider
            value={{
                darkMode: state.darkMode,
                setDarkMode
            }}
        >
            {children}
        </darkModeContext.Provider>
    )

}
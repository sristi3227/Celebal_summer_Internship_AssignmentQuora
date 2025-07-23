"use client"

import { createContext, useContext, useState, useEffect } from "react"

const ThemeContext = createContext()

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem("theme")
      if (saved === null) return false
      // Handle both JSON and plain string values for backward compatibility
      if (saved === "true" || saved === "false") {
        return saved === "true"
      }
      return JSON.parse(saved)
    } catch (error) {
      console.warn("Error parsing theme from localStorage:", error)
      return false
    }
  })

  useEffect(() => {
    localStorage.setItem("theme", isDark.toString())
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light")
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const value = {
    isDark,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

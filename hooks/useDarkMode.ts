import { useState, useEffect, useCallback } from 'react'

const DARK_MODE_STORAGE_KEY = 'contentflow_dark_mode'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Charger le mode sombre depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY)
      if (stored !== null) {
        const darkMode = stored === 'true'
        setIsDark(darkMode)
        applyDarkMode(darkMode)
      } else {
        // Détecter la préférence système par défaut
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(prefersDark)
        applyDarkMode(prefersDark)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du mode sombre:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Appliquer le mode sombre au document
  const applyDarkMode = useCallback((dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Toggle le mode sombre
  const toggleDarkMode = useCallback(() => {
    const newMode = !isDark
    setIsDark(newMode)
    applyDarkMode(newMode)
    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(newMode))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du mode sombre:', error)
    }
  }, [isDark, applyDarkMode])

  return {
    isDark,
    isLoading,
    toggleDarkMode,
  }
}

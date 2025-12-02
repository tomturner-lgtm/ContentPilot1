import { useState, useEffect, useCallback } from 'react'

const THEME_STORAGE_KEY = 'contentflow_theme'
const DARK_MODE_CLASS = 'dark'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)

  // Charger le thème depuis localStorage et system preference
  const loadTheme = useCallback(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
      
      if (stored && (stored === 'light' || stored === 'dark')) {
        setTheme(stored)
        applyTheme(stored)
      } else {
        // Utiliser la préférence système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const systemTheme: Theme = prefersDark ? 'dark' : 'light'
        setTheme(systemTheme)
        applyTheme(systemTheme)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error)
      setTheme('light')
      applyTheme('light')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Appliquer le thème au document
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'dark') {
      root.classList.add(DARK_MODE_CLASS)
    } else {
      root.classList.remove(DARK_MODE_CLASS)
    }
  }, [])

  // Initialiser au montage
  useEffect(() => {
    loadTheme()
    
    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      // Ne mettre à jour que si l'utilisateur n'a pas de préférence sauvegardée
      if (!stored) {
        const systemTheme: Theme = e.matches ? 'dark' : 'light'
        setTheme(systemTheme)
        applyTheme(systemTheme)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [loadTheme, applyTheme])

  // Changer le thème
  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    applyTheme(newTheme)
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error)
    }
  }, [theme, applyTheme])

  return {
    theme,
    isLoading,
    toggleTheme,
    isDark: theme === 'dark',
  }
}

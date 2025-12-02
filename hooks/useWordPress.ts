import { useState, useEffect, useCallback } from 'react'

const WORDPRESS_STORAGE_KEY = 'contentflow_wordpress_config'

export interface WordPressConfig {
  siteUrl: string
  username: string
  applicationPassword: string
  isConnected: boolean
  lastTest?: string
}

export function useWordPress() {
  const [config, setConfig] = useState<WordPressConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger la configuration depuis localStorage
  const loadConfig = useCallback(() => {
    try {
      const stored = localStorage.getItem(WORDPRESS_STORAGE_KEY)
      if (stored) {
        const configData: WordPressConfig = JSON.parse(stored)
        setConfig(configData)
      } else {
        setConfig({
          siteUrl: '',
          username: '',
          applicationPassword: '',
          isConnected: false,
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la config WordPress:', error)
      setConfig({
        siteUrl: '',
        username: '',
        applicationPassword: '',
        isConnected: false,
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialiser au montage
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // Sauvegarder la configuration
  const saveConfig = useCallback(
    (newConfig: Partial<WordPressConfig>) => {
      const updatedConfig: WordPressConfig = {
        ...(config || {
          siteUrl: '',
          username: '',
          applicationPassword: '',
          isConnected: false,
        }),
        ...newConfig,
      }
      try {
        localStorage.setItem(WORDPRESS_STORAGE_KEY, JSON.stringify(updatedConfig))
        setConfig(updatedConfig)
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la config:', error)
        throw error
      }
    },
    [config]
  )

  // Tester la connexion
  const testConnection = useCallback(async () => {
    if (!config?.siteUrl || !config?.username || !config?.applicationPassword) {
      throw new Error('Configuration WordPress incomplète')
    }

    try {
      const response = await fetch('/api/wordpress/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: config.siteUrl,
          username: config.username,
          applicationPassword: config.applicationPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur de connexion')
      }

      const data = await response.json()
      saveConfig({
        isConnected: true,
        lastTest: new Date().toISOString(),
      })
      return data
    } catch (error) {
      saveConfig({
        isConnected: false,
      })
      throw error
    }
  }, [config, saveConfig])

  // Vérifier si la configuration est complète
  const isConfigured = useCallback(() => {
    return (
      config?.siteUrl &&
      config?.username &&
      config?.applicationPassword &&
      config.siteUrl.trim() !== '' &&
      config.username.trim() !== '' &&
      config.applicationPassword.trim() !== ''
    )
  }, [config])

  return {
    config,
    isLoading,
    saveConfig,
    testConnection,
    isConfigured: isConfigured(),
    isConnected: config?.isConnected || false,
  }
}

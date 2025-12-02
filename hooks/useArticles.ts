import { useState, useEffect, useCallback } from 'react'

export interface Article {
  id: string
  title: string
  content: string
  keyword: string
  length: number
  createdAt: string
}

const STORAGE_KEY = 'contentflow_articles'
const MAX_ARTICLES = 50

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Charger les articles depuis localStorage
  const loadArticles = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedArticles: Article[] = JSON.parse(stored)
        // Trier par date (plus récent en premier)
        const sorted = parsedArticles.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setArticles(sorted)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error)
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialiser au montage
  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  // Sauvegarder un nouvel article
  const saveArticle = useCallback(
    (article: Omit<Article, 'id' | 'createdAt'>) => {
      try {
        const newArticle: Article = {
          ...article,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        }

        const currentArticles = [...articles]
        currentArticles.unshift(newArticle) // Ajouter au début

        // Limiter à MAX_ARTICLES articles (garder les plus récents)
        const limitedArticles = currentArticles.slice(0, MAX_ARTICLES)

        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedArticles))
        setArticles(limitedArticles)
        return newArticle
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'article:', error)
        throw error
      }
    },
    [articles]
  )

  // Supprimer un article
  const deleteArticle = useCallback(
    (id: string) => {
      try {
        const filtered = articles.filter((article) => article.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        setArticles(filtered)
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'article:', error)
      }
    },
    [articles]
  )

  // Obtenir un article par ID
  const getArticle = useCallback(
    (id: string) => {
      return articles.find((article) => article.id === id)
    },
    [articles]
  )

  // Obtenir un aperçu du contenu (premiers mots)
  const getPreview = useCallback((content: string, maxLength: number = 150) => {
    const text = content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '') // Enlever les markdown headers et bold
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }, [])

  return {
    articles,
    isLoading,
    saveArticle,
    deleteArticle,
    getArticle,
    getPreview,
  }
}


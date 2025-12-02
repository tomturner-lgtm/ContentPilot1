'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { useQuota } from '@/hooks/useQuota'
import { useArticles } from '@/hooks/useArticles'
import TemplateSelector from '@/components/TemplateSelector'
import LanguageSelector, { useLastLanguage } from '@/components/LanguageSelector'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { Confetti } from '@/components/Confetti'
import { useToastContext } from '@/components/ToastProvider'
import { TemplateType, getTemplate } from '@/lib/templates'
import { LanguageCode, getLanguage } from '@/lib/languages'

export default function GeneratePage() {
  const router = useRouter()
  const quota = useQuota()
  const articles = useArticles()
  const toast = useToastContext()
  const [title, setTitle] = useState('')
  const [keyword, setKeyword] = useState('')
  const [length, setLength] = useState('1000')
  const [template, setTemplate] = useState<TemplateType>('blog-classic')
  const [language, setLanguage] = useState<LanguageCode>('fr')
  const [article, setArticle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  // Charger la dernière langue utilisée au montage
  useEffect(() => {
    const lastLang = useLastLanguage()
    setLanguage(lastLang)
  }, [])

  // Mettre à jour la longueur recommandée quand un template est sélectionné
  useEffect(() => {
    if (template) {
      const templateData = getTemplate(template)
      setLength(templateData.recommendedLength.toString())
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check quota first
    try {
      const quotaRes = await fetch('/api/user/check-quota')
      if (!quotaRes.ok) {
        throw new Error('Erreur lors de la vérification du quota')
      }
      const quotaData = await quotaRes.json()

      if (!quotaData.canGenerate) {
        alert('Limite atteinte! Passez au plan Pro ou achetez un test à 5€.')
        router.push('/pricing')
        return
      }
    } catch (err) {
      console.error('Error checking quota:', err)
      setError('Erreur lors de la vérification du quota')
      return
    }

    setLoading(true)
    setError('')
    setArticle('')
    setProgress(0)

    // Simuler une progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 200)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          keyword,
          length: parseInt(length),
          template,
          language,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      const data = await response.json()
      setProgress(100)
      clearInterval(progressInterval)
      setArticle(data.article)
      
      // Sauvegarder l'article dans l'historique
      const savedArticle = articles.saveArticle({
        title,
        content: data.article,
        keyword,
        length: parseInt(length),
      })
      
      // Incrémenter le quota après succès
      quota.incrementQuota()

      // Toast de succès
      toast.showToast('Article généré avec succès !', 'success')

      // Confettis si c'est le premier article
      if (articles.articles.length === 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    } catch (err) {
      clearInterval(progressInterval)
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      toast.showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  // Afficher le message de limite atteinte si le quota est épuisé
  if (!quota.isLoading && !quota.canGenerate) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="mb-8">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Retour à l'accueil
            </Link>
          </div>

          {/* Message de limite atteinte */}
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Limite atteinte
            </h2>
            <p className="text-gray-600 mb-6">
              Vous avez utilisé vos {quota.limit} article{quota.limit > 1 ? 's' : ''} {quota.planType === 'free' ? 'gratuit' : quota.planType === 'pro' ? 'du plan Pro' : 'du plan Max'} ce mois-ci.
              {quota.planType === 'free' && (
                <> Le quota sera réinitialisé automatiquement le mois prochain.</>
              )}
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
            >
              {quota.planType === 'free' ? 'Passer au plan Pro ou Max' : 'Voir les plans'}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Confettis */}
      <Confetti show={showConfetti} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Retour à l'accueil
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 sm:text-5xl">
            Générateur d'articles
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Remplissez le formulaire pour générer votre article
          </p>
          {quota.remaining > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Il vous reste <span className="font-medium text-primary-600">{quota.remaining}</span> article{quota.remaining > 1 ? 's' : ''} gratuit{quota.remaining > 1 ? 's' : ''} ce mois-ci
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm sm:p-8 animate-fade-in transition-colors">
            <div className="space-y-6">
              {/* Template Selector */}
              <TemplateSelector
                selectedTemplate={template}
                onSelectTemplate={setTemplate}
              />

              {/* Language Selector */}
              <LanguageSelector
                selectedLanguage={language}
                onSelectLanguage={setLanguage}
              />

              {/* Title Input */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Titre de l'article
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="Ex: Comment démarrer une entreprise en ligne"
                />
              </div>

              {/* Keyword Input */}
              <div>
                <label
                  htmlFor="keyword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mot-clé principal
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="Ex: entrepreneuriat en ligne"
                />
              </div>

              {/* Length Selector */}
              <div>
                <label
                  htmlFor="length"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Longueur de l'article
                </label>
                <select
                  id="length"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="500">500 mots</option>
                  <option value="1000">1000 mots</option>
                  <option value="1500">1500 mots</option>
                </select>
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Génération en cours...
                    </span>
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !quota.canGenerate}
                className="w-full rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Génération en cours...' : "Générer l'article"}
              </button>
            </div>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 animate-fade-in">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Article Display */}
        {article && (
          <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-4 border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm text-gray-600">
                Mot-clé: <span className="font-medium">{keyword}</span> |{' '}
                Longueur: <span className="font-medium">{length} mots</span> |{' '}
                Langue: <span className="font-medium">{getLanguage(language).nativeName} {getLanguage(language).flag}</span>
              </p>
            </div>
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown className="text-gray-700 leading-7">
                {article}
              </ReactMarkdown>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
              <Link
                href="/articles"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
              >
                Voir mes articles
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

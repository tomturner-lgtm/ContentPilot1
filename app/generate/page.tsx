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
import { Sparkles, Copy, Save, RotateCcw, Loader2, ArrowLeft } from 'lucide-react'

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
  const [charCount, setCharCount] = useState(0)

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

  // Calculer le nombre de caractères du prompt
  useEffect(() => {
    setCharCount(title.length + keyword.length)
  }, [title, keyword])

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(article)
      toast.showToast('Contenu copié dans le presse-papiers', 'success')
    } catch (err) {
      toast.showToast('Erreur lors de la copie', 'error')
    }
  }

  const handleSave = () => {
    if (article && title) {
      articles.saveArticle({
        title,
        content: article,
        keyword,
        length: parseInt(length),
      })
      toast.showToast('Article sauvegardé avec succès', 'success')
    }
  }

  const handleRegenerate = () => {
    handleSubmit(new Event('submit') as any)
  }

  // Afficher le message de limite atteinte si le quota est épuisé
  if (!quota.isLoading && !quota.canGenerate) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="mb-8">
            <Link
              href="/"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>

          {/* Message de limite atteinte */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Limite atteinte
            </h2>
            <p className="text-slate-600 mb-6">
              Vous avez utilisé vos {quota.limit} article{quota.limit > 1 ? 's' : ''} {quota.planType === 'test' ? 'du plan Test' : quota.planType === 'pro' ? 'du plan Pro' : 'du plan Max'} ce mois-ci.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              {quota.planType === 'test' ? 'Passer au plan Pro ou Max' : 'Voir les plans'}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Confettis */}
      <Confetti show={showConfetti} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Générateur d'articles
          </h1>
          <p className="text-slate-500">
            Créez du contenu optimisé SEO en quelques secondes
          </p>
          {quota.remaining > 0 && (
            <p className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Il vous reste <span className="text-indigo-600">{quota.remaining}</span> article{quota.remaining > 1 ? 's' : ''} ce mois-ci
            </p>
          )}
        </div>

        {/* Layout à 2 colonnes sur desktop */}
        <div className="grid gap-6 lg:grid-cols-[40%_60%]">
          {/* Panneau de gauche - Formulaire */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 lg:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre de section */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Configuration
                </h2>
              </div>

              {/* Grille pour les selecteurs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Template Selector - Adapté pour la grille */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Template
                  </label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as TemplateType)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="blog-classic">Classique</option>
                    <option value="blog-list">Liste</option>
                    <option value="blog-howto">Guide</option>
                    <option value="blog-review">Avis</option>
                    <option value="blog-news">Actualité</option>
                  </select>
                </div>

                {/* Language Selector - Adapté pour la grille */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Langue
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="fr">Français 🇫🇷</option>
                    <option value="en">English 🇬🇧</option>
                    <option value="es">Español 🇪🇸</option>
                    <option value="de">Deutsch 🇩🇪</option>
                    <option value="it">Italiano 🇮🇹</option>
                  </select>
                </div>
              </div>

              {/* Longueur */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Longueur
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="500">500 mots</option>
                  <option value="1000">1000 mots</option>
                  <option value="1500">1500 mots</option>
                  <option value="2000">2000 mots</option>
                </select>
              </div>

              {/* Titre */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Titre de l'article
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ex: Comment démarrer une entreprise en ligne"
                />
              </div>

              {/* Mot-clé */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Mot-clé principal
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ex: entrepreneuriat en ligne"
                />
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">
                      Génération en cours...
                    </span>
                    <span className="text-xs font-medium text-indigo-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Bouton Générer */}
              <button
                type="submit"
                disabled={loading || !quota.canGenerate}
                className="w-full rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Générer l'article
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Panneau de droite - Résultat */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 lg:p-8 min-h-[600px] relative">
            {article ? (
              <>
                {/* Barre d'outils flottante */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-2 shadow-sm z-10">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Copier"
                  >
                    <Copy className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Sauvegarder"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Régénérer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                  </button>
                </div>

                {/* Contenu de l'article */}
                <div className="prose prose-lg max-w-none">
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">{title}</h2>
                    <p className="text-sm text-slate-500">
                      Mot-clé: <span className="font-medium text-slate-700">{keyword}</span> •{' '}
                      Longueur: <span className="font-medium text-slate-700">{length} mots</span> •{' '}
                      Langue: <span className="font-medium text-slate-700">{getLanguage(language).nativeName} {getLanguage(language).flag}</span>
                    </p>
                  </div>
                  <div className="text-slate-700 leading-7">
                    <ReactMarkdown>{article}</ReactMarkdown>
                  </div>
                </div>
              </>
            ) : (
              /* Placeholder quand aucun résultat */
              <div className="flex items-center justify-center h-full min-h-[500px]">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Sparkles className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Votre contenu généré apparaîtra ici
                  </p>
                  <p className="text-xs text-slate-400">
                    Remplissez le formulaire et cliquez sur "Générer l'article"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

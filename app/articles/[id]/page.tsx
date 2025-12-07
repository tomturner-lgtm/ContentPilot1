'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { useArticles } from '@/hooks/useArticles'
import { useWordPress } from '@/hooks/useWordPress'
import { marked } from 'marked'

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getArticle, deleteArticle } = useArticles()
  const { config: wpConfig, isConfigured } = useWordPress()
  const articleId = params.id as string
  const article = getArticle(articleId)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'draft' | 'publish'>('draft')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = useState<{ link: string; status: string } | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Fonction pour nettoyer le titre pour le nom de fichier
  const sanitizeFileName = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, '') // Enlever les tirets au début et à la fin
      .substring(0, 50) // Limiter la longueur
  }

  // Copier le texte brut
  const copyText = async () => {
    if (!article) return
    try {
      await navigator.clipboard.writeText(article.content)
      alert('Texte copié dans le presse-papiers !')
    } catch (err) {
      alert('Erreur lors de la copie')
    }
  }

  // Télécharger en Markdown
  const downloadMarkdown = () => {
    if (!article) return
    const blob = new Blob([article.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date(article.createdAt).toISOString().split('T')[0]
    a.download = `article-${sanitizeFileName(article.title)}-${date}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Convertir Markdown en HTML
  const markdownToHtml = (markdown: string) => {
    return marked(markdown)
  }

  // Télécharger en HTML
  const downloadHTML = () => {
    if (!article) return
    const html = markdownToHtml(article.content)
    const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3 { color: #1a1a1a; }
    h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h2 { margin-top: 2rem; }
    code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    blockquote { border-left: 4px solid #8b5cf6; padding-left: 1rem; margin-left: 0; color: #666; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <div>
    ${html}
  </div>
</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date(article.createdAt).toISOString().split('T')[0]
    a.download = `article-${sanitizeFileName(article.title)}-${date}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copier en HTML
  const copyHTML = async () => {
    if (!article) return
    try {
      const html = await markdownToHtml(article.content) // <--- Ajoute await ici
      await navigator.clipboard.writeText(html)
      alert('HTML copié dans le presse-papiers !')
    } catch (err) {
      alert('Erreur lors de la copie')
    }
  }

  // Publier sur WordPress
  const publishToWordPress = async () => {
    if (!article || !wpConfig) return

    setPublishing(true)
    setPublishError(null)
    setPublishSuccess(null)

    try {
      // Convertir le markdown en HTML pour WordPress
      const htmlContent = markdownToHtml(article.content)

      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: wpConfig.siteUrl,
          username: wpConfig.username,
          applicationPassword: wpConfig.applicationPassword,
          title: article.title,
          content: htmlContent,
          status: publishStatus,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la publication')
      }

      const data = await response.json()
      setPublishSuccess({
        link: data.post.link,
        status: data.post.status,
      })
      setShowPublishModal(false)
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : 'Erreur lors de la publication'
      )
    } finally {
      setPublishing(false)
    }
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="mb-8">
            <Link
              href="/articles"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Retour aux articles
            </Link>
          </div>
          <div className="rounded-xl bg-white p-12 shadow-sm text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Article non trouvé
            </h2>
            <p className="text-gray-600 mb-6">
              L'article que vous cherchez n'existe pas ou a été supprimé.
            </p>
            <Link
              href="/articles"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Retour aux articles
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <Link
            href="/articles"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Retour aux articles
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8 mb-6">
          <div className="mb-6 border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                <span>{formatDate(article.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
                <span>{article.length} mots</span>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  {article.keyword}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'export */}
          <div className="mb-6 flex flex-wrap gap-3">
            {/* Bouton WordPress */}
            {isConfigured && (
              <button
                onClick={() => setShowPublishModal(true)}
                className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21.469 6.825c.84 0 1.5.561 1.5 1.5v10.5c0 .839-.66 1.5-1.5 1.5h-16.5c-.839 0-1.5-.661-1.5-1.5v-10.5c0-.939.66-1.5 1.5-1.5h16.5zm-11.561 5.625c-.06 0-.18.06-.239.121-.121.18-.121.42 0 .539l2.701 2.641c.06.06.18.12.3.12.119 0 .239-.06.3-.12l2.761-2.641c.121-.119.121-.359 0-.539-.061-.061-.18-.121-.3-.121-.119 0-.239.06-.3.12l-2.221 2.1-2.221-2.1c-.06-.06-.18-.12-.3-.12zm-4.53-5.625c-.781 0-1.5.6-1.5 1.5v10.5c0 .84.719 1.5 1.5 1.5h16.531c.781 0 1.5-.66 1.5-1.5v-10.5c0-.9-.719-1.5-1.5-1.5h-16.531z" />
                </svg>
                Publier sur WordPress
              </button>
            )}
            <button
              onClick={copyText}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                />
              </svg>
              Copier le texte
            </button>
            <button
              onClick={downloadMarkdown}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Télécharger .md
            </button>
            <button
              onClick={downloadHTML}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Télécharger .html
            </button>
            <button
              onClick={copyHTML}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h5.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
              Copier en HTML
            </button>
          </div>

          {/* Contenu de l'article */}
          <div className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900">
            <ReactMarkdown className="text-gray-700 leading-7">
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Bouton de suppression */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                if (
                  confirm(
                    'Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.'
                  )
                ) {
                  deleteArticle(article.id)
                  router.push('/articles')
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Supprimer l'article
            </button>
          </div>
        </div>

        {/* Modal de publication WordPress */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Publier sur WordPress
                </h3>
                <button
                  onClick={() => {
                    setShowPublishModal(false)
                    setPublishError(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Choisissez le statut de publication pour cet article :
                </p>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 rounded-lg border border-gray-300 p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={publishStatus === 'draft'}
                      onChange={(e) =>
                        setPublishStatus(e.target.value as 'draft' | 'publish')
                      }
                      className="h-4 w-4 text-primary-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Brouillon</div>
                      <div className="text-xs text-gray-500">
                        L'article sera sauvegardé en tant que brouillon
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 rounded-lg border border-gray-300 p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="status"
                      value="publish"
                      checked={publishStatus === 'publish'}
                      onChange={(e) =>
                        setPublishStatus(e.target.value as 'draft' | 'publish')
                      }
                      className="h-4 w-4 text-primary-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Publié</div>
                      <div className="text-xs text-gray-500">
                        L'article sera immédiatement publié sur votre site
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {publishError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{publishError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPublishModal(false)
                    setPublishError(null)
                  }}
                  disabled={publishing}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={publishToWordPress}
                  disabled={publishing}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {publishing ? 'Publication...' : 'Publier'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message de succès */}
        {publishSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-center text-xl font-bold text-gray-900">
                Article publié avec succès !
              </h3>
              <p className="mb-4 text-center text-sm text-gray-600">
                Votre article a été{' '}
                {publishSuccess.status === 'publish'
                  ? 'publié'
                  : 'sauvegardé en brouillon'}{' '}
                sur WordPress.
              </p>
              <div className="flex gap-3">
                <a
                  href={publishSuccess.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
                >
                  Voir l'article
                </a>
                <button
                  onClick={() => setPublishSuccess(null)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

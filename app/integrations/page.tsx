'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWordPress } from '@/hooks/useWordPress'

export default function IntegrationsPage() {
  const { config, isLoading, saveConfig, testConnection, isConfigured } =
    useWordPress()
  const [siteUrl, setSiteUrl] = useState('')
  const [username, setUsername] = useState('')
  const [applicationPassword, setApplicationPassword] = useState('')

  // Charger les valeurs depuis config quand disponible
  useEffect(() => {
    if (config && !isLoading) {
      setSiteUrl(config.siteUrl || '')
      setUsername(config.username || '')
      setApplicationPassword(config.applicationPassword || '')
    }
  }, [config, isLoading])
  const [testing, setTesting] = useState(false)
  const [testingError, setTestingError] = useState<string | null>(null)
  const [testingSuccess, setTestingSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setTestingError(null)
    setTestingSuccess(false)

    try {
      saveConfig({
        siteUrl: siteUrl.trim(),
        username: username.trim(),
        applicationPassword: applicationPassword.trim(),
        isConnected: false,
      })
      alert('Configuration sauvegardée avec succès !')
    } catch (error) {
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestingError(null)
    setTestingSuccess(false)

    try {
      // Sauvegarder d'abord
      saveConfig({
        siteUrl: siteUrl.trim(),
        username: username.trim(),
        applicationPassword: applicationPassword.trim(),
        isConnected: false,
      })

      // Tester la connexion
      await testConnection()
      setTestingSuccess(true)
    } catch (error) {
      setTestingError(
        error instanceof Error ? error.message : 'Erreur de connexion'
      )
    } finally {
      setTesting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Retour à l'accueil
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-2">
            Intégrations
          </h1>
          <p className="text-lg text-gray-600">
            Connectez vos services externes pour publier vos articles
          </p>
        </div>

        {/* WordPress Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21.469 6.825c.84 0 1.5.561 1.5 1.5v10.5c0 .839-.66 1.5-1.5 1.5h-16.5c-.839 0-1.5-.661-1.5-1.5v-10.5c0-.939.66-1.5 1.5-1.5h16.5zm-11.561 5.625c-.06 0-.18.06-.239.121-.121.18-.121.42 0 .539l2.701 2.641c.06.06.18.12.3.12.119 0 .239-.06.3-.12l2.761-2.641c.121-.119.121-.359 0-.539-.061-.061-.18-.121-.3-.121-.119 0-.239.06-.3.12l-2.221 2.1-2.221-2.1c-.06-.06-.18-.12-.3-.12zm-4.53-5.625c-.781 0-1.5.6-1.5 1.5v10.5c0 .84.719 1.5 1.5 1.5h16.531c.781 0 1.5-.66 1.5-1.5v-10.5c0-.9-.719-1.5-1.5-1.5h-16.531z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">WordPress</h2>
              <p className="text-sm text-gray-600">
                Publiez vos articles directement sur votre site WordPress
              </p>
            </div>
          </div>

          {/* Status */}
          {config?.isConnected && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600"
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
                <span className="text-sm font-medium text-green-800">
                  Connexion WordPress active
                </span>
              </div>
              {config.lastTest && (
                <p className="text-xs text-green-700 mt-1">
                  Dernier test réussi le{' '}
                  {new Date(config.lastTest).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            {/* Site URL */}
            <div>
              <label
                htmlFor="siteUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                URL du site WordPress
              </label>
              <input
                type="url"
                id="siteUrl"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                URL complète de votre site WordPress (sans slash final)
              </p>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Application Password */}
            <div>
              <label
                htmlFor="appPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Application Password
              </label>
              <input
                type="password"
                id="appPassword"
                value={applicationPassword}
                onChange={(e) => setApplicationPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Créez un Application Password dans votre profil WordPress :
                Utilisateurs → Votre profil → Application Passwords
              </p>
            </div>

            {/* Error Message */}
            {testingError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Erreur de connexion
                    </p>
                    <p className="text-sm text-red-700 mt-1">{testingError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {testingSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
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
                  <p className="text-sm font-medium text-green-800">
                    Connexion réussie ! Vous pouvez maintenant publier vos articles sur WordPress.
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !isConfigured}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? 'Test en cours...' : 'Tester la connexion'}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Comment obtenir une Application Password ?
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Connectez-vous à votre administration WordPress</li>
            <li>Allez dans Utilisateurs → Votre profil</li>
            <li>Faites défiler jusqu'à la section "Application Passwords"</li>
            <li>Donnez un nom (ex: "ContentFlow")</li>
            <li>Cliquez sur "Ajouter une nouvelle application"</li>
            <li>Copiez le mot de passe généré (il ne sera plus visible)</li>
            <li>Collez-le dans le champ ci-dessus</li>
          </ol>
        </div>
      </div>
    </main>
  )
}

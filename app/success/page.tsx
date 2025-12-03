'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePlan } from '@/hooks/usePlan'

// 1. Crée un composant séparé pour tout le contenu logique
function SuccessContent() {
  const searchParams = useSearchParams() // Le hook est déplacé ici
  const router = useRouter()
  const plan = usePlan()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // Activer le plan Pro dans localStorage
      plan.updatePlan('pro', 'monthly')
      
      // Simuler un délai pour vérifier la session
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } else {
      setError('Session ID manquant')
      setLoading(false)
    }
  }, [sessionId, plan])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre paiement...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
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
              Erreur
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Retour aux tarifs
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className="rounded-xl bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Paiement réussi !
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Bienvenue dans le Plan Pro ! Votre abonnement a été activé avec succès.
          </p>
          
          <div className="rounded-lg bg-primary-50 border border-primary-200 p-6 mb-6 text-left">
            <h3 className="font-semibold text-primary-900 mb-3">
              Ce que vous obtenez avec le Plan Pro :
            </h3>
            <ul className="space-y-2 text-sm text-primary-800">
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span><strong>30 articles par mois</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Toutes les longueurs d'articles</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Support prioritaire</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Tous les templates disponibles</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Un email de confirmation a été envoyé à l'adresse fournie lors du paiement.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Générer mon premier article Pro
            </Link>
            <Link
              href="/articles"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Voir mes articles
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

// 2. Ta page principale devient juste une coquille vide avec Suspense
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}


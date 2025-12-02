'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePlan, PLAN_LIMITS, PLAN_PRICES } from '@/hooks/usePlan'

export default function PricingPage() {
  const plan = usePlan()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  // Calculer les prix annuels (11 mois payés)
  const getYearlyPrice = (monthlyPrice: number) => {
    return monthlyPrice * 11
  }

  // Obtenir le prix affiché selon la période
  const getPrice = (monthlyPrice: number) => {
    return billingPeriod === 'yearly' ? getYearlyPrice(monthlyPrice) : monthlyPrice
  }

  // Obtenir l'économie annuelle
  const getSavings = (monthlyPrice: number) => {
    return monthlyPrice * 12 - getYearlyPrice(monthlyPrice)
  }

  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    try {
      setLoading(priceId)

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      const data = await response.json()

      if (data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error('URL de checkout non reçue')
      }
    } catch (error) {
      console.error('Erreur checkout:', error)
      alert(error instanceof Error ? error.message : 'Une erreur est survenue')
      setLoading(null)
    }
  }

  const handleTestPurchase = async () => {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_TEST
    if (!priceId) {
      alert('Stripe Price ID pour le test non configuré')
      return
    }
    await handleCheckout(priceId)
  }

  const handleProCheckout = async () => {
    const priceId =
      billingPeriod === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
    if (!priceId) {
      alert('Stripe Price ID pour le plan Pro non configuré')
      return
    }
    await handleCheckout(priceId)
  }

  const handleUnlimitedCheckout = async () => {
    const priceId =
      billingPeriod === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
    if (!priceId) {
      alert('Stripe Price ID pour le plan Illimité non configuré')
      return
    }
    await handleCheckout(priceId)
  }

  const handleSelectPlan = (planType: 'test' | 'pro' | 'unlimited') => {
    if (planType === 'test') {
      handleTestPurchase()
    } else if (planType === 'pro') {
      handleProCheckout()
    } else if (planType === 'unlimited') {
      handleUnlimitedCheckout()
    }
  }

  const isCurrentPlan = (planType: 'test' | 'pro' | 'unlimited') => {
    // Map old plan types to new ones for compatibility
    const planMap: Record<string, string> = {
      free: 'test',
      max: 'unlimited',
    }
    const mappedPlan = planMap[plan.currentPlanType] || plan.currentPlanType
    return mappedPlan === planType
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Retour à l'accueil
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Plans et tarifs
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choisissez le plan qui correspond à vos besoins
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm font-medium ${
                billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Mensuel
            </span>
            <button
              onClick={() =>
                setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')
              }
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              Annuel
            </span>
            {billingPeriod === 'yearly' && (
              <span className="ml-2 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                1 mois offert
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Plan Test à 5€ */}
          <div
            className={`rounded-xl bg-white p-8 shadow-sm border-2 ${
              isCurrentPlan('test')
                ? 'border-primary-500'
                : 'border-gray-200'
            }`}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Test
              </h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">5€</span>
                <span className="text-gray-600 ml-2">une fois</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Pour tester le service</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">
                  <strong>1</strong> article
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Longueurs personnalisables</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Articles optimisés SEO</span>
              </li>
            </ul>
            <button
              onClick={() => handleSelectPlan('test')}
              disabled={loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_TEST}
              className={`w-full rounded-lg px-6 py-3 text-base font-semibold transition-colors ${
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_TEST
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_TEST
                ? 'Redirection...'
                : 'Tester pour 5€'}
            </button>
          </div>

          {/* Plan Pro */}
          <div
            className={`rounded-xl bg-white p-8 shadow-lg border-2 relative ${
              isCurrentPlan('pro')
                ? 'border-primary-500'
                : 'border-primary-300'
            }`}
          >
            {!isCurrentPlan('pro') && (
              <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                Recommandé
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Pro</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">
                  {getPrice(PLAN_PRICES.pro)}€
                </span>
                <span className="text-gray-600 ml-2">
                  /{billingPeriod === 'yearly' ? 'an' : 'mois'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-gray-500 mt-2">
                  Économisez {getSavings(PLAN_PRICES.pro)}€ par an
                </p>
              )}
              {billingPeriod === 'monthly' && (
                <p className="text-sm text-gray-500 mt-2">
                  {PLAN_PRICES.pro}€ par mois
                </p>
              )}
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700 font-medium">
                  <strong>{PLAN_LIMITS.pro}</strong> articles par mois (30 articles)
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Toutes les longueurs</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Support prioritaire</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Modèles personnalisés</span>
              </li>
            </ul>
            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={
                isCurrentPlan('pro') ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
              }
              className={`w-full rounded-lg px-6 py-3 text-base font-semibold transition-colors ${
                isCurrentPlan('pro')
                  ? 'bg-primary-200 text-primary-700 cursor-not-allowed'
                  : loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ||
                    loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
                  ? 'bg-primary-400 text-white cursor-wait'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ||
              loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Redirection vers Stripe...
                </span>
              ) : isCurrentPlan('pro') ? (
                'Plan actuel'
              ) : (
                "S'abonner"
              )}
            </button>
            <p className="mt-4 text-xs text-center text-gray-500">
              Paiement sécurisé • Annulation à tout moment
            </p>
          </div>

          {/* Plan Illimité */}
          <div
            className={`rounded-xl bg-white p-8 shadow-sm border-2 ${
              isCurrentPlan('unlimited')
                ? 'border-primary-500'
                : 'border-gray-200'
            }`}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Max</h3>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900">
                  {getPrice(PLAN_PRICES.max)}€
                </span>
                <span className="text-gray-600 ml-2">
                  /{billingPeriod === 'yearly' ? 'an' : 'mois'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-gray-500 mt-2">
                  Économisez {getSavings(PLAN_PRICES.max)}€ par an
                </p>
              )}
              {billingPeriod === 'monthly' && (
                <p className="text-sm text-gray-500 mt-2">
                  {PLAN_PRICES.max}€ par mois
                </p>
              )}
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700 font-medium">
                  Articles <strong>illimités</strong>
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Toutes les longueurs</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Support prioritaire 24/7</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">Modèles personnalisés</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-gray-700">API dédiée</span>
              </li>
            </ul>
            <button
              onClick={() => handleSelectPlan('unlimited')}
              disabled={
                isCurrentPlan('unlimited') ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
              }
              className={`w-full rounded-lg px-6 py-3 text-base font-semibold transition-colors ${
                isCurrentPlan('unlimited')
                  ? 'bg-primary-200 text-primary-700 cursor-not-allowed'
                  : loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ||
                    loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
                  ? 'bg-gray-600 text-white cursor-wait'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ||
              loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
                ? 'Redirection...'
                : isCurrentPlan('unlimited')
                ? 'Plan actuel'
                : 'Commencer maintenant'}
            </button>
            <p className="mt-4 text-xs text-center text-gray-500">
              Paiement sécurisé • Annulation à tout moment
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Besoin d'un plan personnalisé pour votre équipe ?
          </p>
          <Link
            href="mailto:contact@contentflow.com"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Contactez-nous →
          </Link>
        </div>
      </div>
    </main>
  )
}
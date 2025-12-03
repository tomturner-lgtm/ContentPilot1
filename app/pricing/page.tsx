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
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="mb-8">
          <Link
            href="/"
            className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour à l'accueil
          </Link>
        </div>

        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Plans et tarifs
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            Choisissez le plan qui correspond à vos besoins
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className={`text-sm font-medium transition-colors ${
                billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Mensuel
            </span>
            <button
              onClick={() =>
                setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')
              }
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors ${
                billingPeriod === 'yearly' ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              Annuel
            </span>
            {billingPeriod === 'yearly' && (
              <span className="ml-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full">
                1 mois offert
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3 max-w-6xl mx-auto">
          {/* Plan Test à 5€ */}
          <div
            className={`rounded-2xl bg-white p-8 shadow-sm border transition-all duration-200 hover:shadow-md ${
              isCurrentPlan('test')
                ? 'border-indigo-300'
                : 'border-gray-200'
            }`}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">
                Test
              </h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-slate-900">5€</span>
                <span className="text-slate-600 ml-2 text-lg">une fois</span>
              </div>
              <p className="text-sm text-slate-500">Pour tester le service</p>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">
                  <strong>1</strong> article
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Longueurs personnalisables</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Articles optimisés SEO</span>
              </li>
            </ul>
            <button
              onClick={() => handleSelectPlan('test')}
              disabled={loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_TEST}
              className={`w-full rounded-xl px-6 py-3.5 text-base font-semibold transition-all duration-200 ${
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_TEST
                  ? 'bg-slate-400 text-white cursor-wait'
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02]'
              }`}
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_TEST
                ? 'Redirection...'
                : 'Tester pour 5€'}
            </button>
          </div>

          {/* Plan Pro */}
          <div
            className={`rounded-2xl bg-white p-8 border relative transition-all duration-200 hover:shadow-md ${
              isCurrentPlan('pro')
                ? 'border-indigo-300 shadow-md'
                : 'border-indigo-200 shadow-sm'
            }`}
          >
            {!isCurrentPlan('pro') && (
              <div className="absolute -top-3 right-6 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
                Recommandé
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Plan Pro</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-slate-900">
                  {getPrice(PLAN_PRICES.pro)}€
                </span>
                <span className="text-slate-600 ml-2 text-lg">
                  /{billingPeriod === 'yearly' ? 'an' : 'mois'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-slate-500">
                  Économisez {getSavings(PLAN_PRICES.pro)}€ par an
                </p>
              )}
              {billingPeriod === 'monthly' && (
                <p className="text-sm text-slate-500">
                  {PLAN_PRICES.pro}€ par mois
                </p>
              )}
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700 font-medium">
                  <strong>{PLAN_LIMITS.pro}</strong> articles par mois
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Toutes les longueurs</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Support prioritaire</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Modèles personnalisés</span>
              </li>
            </ul>
            <button
              onClick={() => handleSelectPlan('pro')}
              disabled={
                isCurrentPlan('pro') ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
              }
              className={`w-full rounded-xl px-6 py-3.5 text-base font-semibold transition-all duration-200 ${
                isCurrentPlan('pro')
                  ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed'
                  : loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ||
                    loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]'
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
                  Redirection...
                </span>
              ) : isCurrentPlan('pro') ? (
                'Plan actuel'
              ) : (
                "S'abonner"
              )}
            </button>
            <p className="mt-4 text-xs text-center text-slate-500">
              Paiement sécurisé • Annulation à tout moment
            </p>
          </div>

          {/* Plan Illimité */}
          <div
            className={`rounded-2xl bg-white p-8 border transition-all duration-200 hover:shadow-md ${
              isCurrentPlan('unlimited')
                ? 'border-indigo-300'
                : 'border-gray-200 shadow-sm'
            }`}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Plan Max</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-slate-900">
                  {getPrice(PLAN_PRICES.max)}€
                </span>
                <span className="text-slate-600 ml-2 text-lg">
                  /{billingPeriod === 'yearly' ? 'an' : 'mois'}
                </span>
              </div>
              {billingPeriod === 'yearly' && (
                <p className="text-sm text-slate-500">
                  Économisez {getSavings(PLAN_PRICES.max)}€ par an
                </p>
              )}
              {billingPeriod === 'monthly' && (
                <p className="text-sm text-slate-500">
                  {PLAN_PRICES.max}€ par mois
                </p>
              )}
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700 font-medium">
                  Articles <strong>illimités</strong>
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Toutes les longueurs</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Support prioritaire 24/7</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">Modèles personnalisés</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0"
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
                <span className="text-slate-700">API dédiée</span>
              </li>
            </ul>
            <button
              onClick={() => handleSelectPlan('unlimited')}
              disabled={
                isCurrentPlan('unlimited') ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ||
                loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
              }
              className={`w-full rounded-xl px-6 py-3.5 text-base font-semibold transition-all duration-200 ${
                isCurrentPlan('unlimited')
                  ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed'
                  : loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ||
                    loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
                  ? 'bg-slate-600 text-white cursor-wait'
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02]'
              }`}
            >
              {loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY ||
              loading === process.env.NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
                ? 'Redirection...'
                : isCurrentPlan('unlimited')
                ? 'Plan actuel'
                : 'Commencer maintenant'}
            </button>
            <p className="mt-4 text-xs text-center text-slate-500">
              Paiement sécurisé • Annulation à tout moment
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">
            Besoin d'un plan personnalisé pour votre équipe ?
          </p>
          <Link
            href="mailto:contact@contentpilot.com"
            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors inline-flex items-center gap-1"
          >
            Contactez-nous
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  )
}
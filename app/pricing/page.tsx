'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, Sparkles, Zap, Crown } from 'lucide-react'

interface StripePrices {
  test: string | null
  proMonthly: string | null
  proYearly: string | null
  unlimitedMonthly: string | null
  unlimitedYearly: string | null
}

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [prices, setPrices] = useState<StripePrices | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Charger les price IDs depuis l'API
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/stripe/prices')
        const data = await res.json()
        setPrices(data)
      } catch (err) {
        console.error('Error fetching prices:', err)
      }
    }
    fetchPrices()
  }, [])

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkSession()
  }, [supabase])

  const handleCheckout = async (priceId: string | null) => {
    if (!priceId) {
      alert('Cette offre n\'est pas encore configurée')
      return
    }

    // Vérifier si l'utilisateur est connecté
    if (!isLoggedIn) {
      router.push('/login?redirect=/pricing')
      return
    }

    try {
      setLoading(priceId)

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      const data = await response.json()

      if (data.url) {
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

  const plans = [
    {
      id: 'test',
      name: 'Test',
      description: 'Essayez avec 1 article',
      icon: Sparkles,
      priceMonthly: 5,
      priceYearly: 5, // One-time, pas d'annuel
      isOneTime: true,
      features: [
        '1 article SEO optimisé',
        'Tous les templates',
        '5 langues disponibles',
        'Sans engagement',
      ],
      priceId: prices?.test,
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Idéal pour les créateurs',
      icon: Zap,
      priceMonthly: 29,
      priceYearly: 290, // ~10 mois
      isOneTime: false,
      features: [
        '50 articles / mois',
        'Tous les templates',
        '5 langues disponibles',
        'Export WordPress',
        'Support prioritaire',
      ],
      priceId: billingPeriod === 'monthly' ? prices?.proMonthly : prices?.proYearly,
      popular: true,
    },
    {
      id: 'unlimited',
      name: 'Max',
      description: 'Pour les agences',
      icon: Crown,
      priceMonthly: 79,
      priceYearly: 790, // ~10 mois
      isOneTime: false,
      features: [
        'Articles illimités',
        'Tous les templates',
        '5 langues disponibles',
        'Export WordPress',
        'Support prioritaire',
        'API access',
      ],
      priceId: billingPeriod === 'monthly' ? prices?.unlimitedMonthly : prices?.unlimitedYearly,
      popular: false,
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour à l'accueil
          </Link>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Plans et tarifs
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            Choisissez le plan qui correspond à vos besoins
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-indigo-600 transition-colors"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Annuel
              <span className="ml-1 text-xs text-green-600 font-semibold">-17%</span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            const displayPrice = plan.isOneTime ? plan.priceMonthly : (billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly)

            return (
              <div
                key={plan.id}
                id={plan.id}
                className={`relative rounded-2xl bg-white border ${plan.popular ? 'border-indigo-200 ring-2 ring-indigo-600' : 'border-gray-200'
                  } shadow-sm p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    POPULAIRE
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${plan.popular ? 'bg-indigo-100' : 'bg-slate-100'
                    }`}>
                    <Icon className={`h-6 w-6 ${plan.popular ? 'text-indigo-600' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{displayPrice}€</span>
                    <span className="text-slate-500">
                      {plan.isOneTime ? '' : billingPeriod === 'monthly' ? '/mois' : '/an'}
                    </span>
                  </div>
                  {plan.isOneTime && (
                    <p className="text-sm text-slate-500 mt-1">Paiement unique</p>
                  )}
                  {!plan.isOneTime && billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mt-1">
                      Économisez {Math.round(plan.priceMonthly * 12 - plan.priceYearly)}€/an
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.priceId || null)}
                  disabled={loading === plan.priceId || !prices}
                  className={`w-full rounded-xl px-6 py-3 text-base font-semibold transition-all ${plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.priceId ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Chargement...
                    </span>
                  ) : (
                    isLoggedIn ? 'Choisir ce plan' : 'Se connecter pour acheter'
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ ou infos */}
        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>Paiement sécurisé par Stripe • Annulation à tout moment</p>
        </div>
      </div>
    </main>
  )
}
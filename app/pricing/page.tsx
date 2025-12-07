'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react'
import { usePlan } from '@/hooks/usePlan'

interface StripePrices {
  test: string | null
  proMonthly: string | null
  proYearly: string | null
  unlimitedMonthly: string | null
  unlimitedYearly: string | null
}

const FEATURES = [
  { name: 'Articles par mois', test: '1', pro: '30', max: '200' },
  { name: 'Templates disponibles', test: true, pro: true, max: true },
  { name: '5 langues (FR, EN, ES, DE, IT)', test: true, pro: true, max: true },
  { name: 'Export WordPress', test: false, pro: true, max: true },
  { name: 'Support prioritaire', test: false, pro: true, max: true },
  { name: 'Historique des articles', test: false, pro: true, max: true },
  { name: 'API access', test: false, pro: false, max: true },
  { name: 'Multi-utilisateurs', test: false, pro: false, max: true },
]
export default function PricingPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { plan: currentPlan, isLoading: planLoading } = usePlan() // Use the hook
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [prices, setPrices] = useState<StripePrices | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // ... useEffects

  // Helper to determine plan order
  const getPlanWeight = (planType: string) => {
    switch (planType) {
      case 'max': return 3
      case 'pro': return 2
      case 'test': return 0 // Test is one-time, treated differently
      default: return 0 // Free
    }
  }

  const handleCheckout = async (priceId: string | null, planId: string) => {
    if (!priceId) {
      alert('Cette offre n\'est pas encore configurée')
      return
    }

    if (!isLoggedIn) {
      router.push('/login?redirect=/pricing')
      return
    }

    // Block if trying to subscribe to same or lower plan (except if switching billing period, but simplified here)
    if (currentPlan && currentPlan.type === planId && !['test'].includes(planId)) {
      return // Already on this plan
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
      priceYearly: 5,
      isOneTime: true,
      priceId: prices?.test,
      color: 'slate',
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Idéal pour les créateurs',
      icon: Zap,
      priceMonthly: 50,
      priceYearly: 550,
      isOneTime: false,
      priceId: billingPeriod === 'monthly' ? prices?.proMonthly : prices?.proYearly,
      color: 'indigo',
      popular: true,
    },
    {
      id: 'max',
      name: 'Max',
      description: 'Pour les agences',
      icon: Crown,
      priceMonthly: 100,
      priceYearly: 1100,
      isOneTime: false,
      priceId: billingPeriod === 'monthly' ? prices?.unlimitedMonthly : prices?.unlimitedYearly,
      color: 'purple',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        {/* Header ... */}

        {/* ... (keep existing header code) ... */}

        {/* Plans Cards */}
        <div className="grid gap-6 lg:grid-cols-3 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon
            const displayPrice = plan.isOneTime ? plan.priceMonthly : (billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly)

            // Logic for button state
            const isCurrentPlan = currentPlan?.type === plan.id
            const currentPlanWeight = getPlanWeight(currentPlan?.type || 'free')
            const planWeight = getPlanWeight(plan.id)
            const isUpgrade = planWeight > currentPlanWeight
            const isDowngradeOrSame = planWeight <= currentPlanWeight && !plan.isOneTime

            // Allow "Test" purchase always (it's one-time)
            const canPurchase = plan.isOneTime || isUpgrade || !currentPlan || (isCurrentPlan && false) // Can't re-subscribe to exact same plan here easily without portal

            let buttonText = isLoggedIn ? 'Choisir ce plan' : 'Commencer'
            if (isLoggedIn && !planLoading) {
              if (isCurrentPlan) buttonText = 'Plan actuel'
              else if (isUpgrade) buttonText = 'Mettre à niveau'
              else if (isDowngradeOrSame && !plan.isOneTime) buttonText = 'Inclus'
            }

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-white border-2 ${plan.popular ? 'border-indigo-500 shadow-lg shadow-indigo-100' : 'border-gray-200'
                  } p-6 sm:p-8`}
              >
                {/* ... (keep existing card content) ... */}

                {/* Re-render card content to ensure context matches */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    ⭐ RECOMMANDÉ
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
                  {plan.isOneTime && <p className="text-sm text-slate-500 mt-1">Paiement unique</p>}
                  {!plan.isOneTime && billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mt-1">
                      Économisez {Math.round(plan.priceMonthly * 12 - plan.priceYearly)}€/an
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleCheckout(plan.priceId || null, plan.id)}
                  disabled={(loading !== null && loading === plan.priceId) || !prices || (isCurrentPlan && !plan.isOneTime) || (!isUpgrade && !plan.isOneTime && isLoggedIn && currentPlan?.type !== 'free')}
                  className={`w-full rounded-xl px-6 py-3.5 text-base font-semibold transition-all hover:scale-[1.02] ${isCurrentPlan
                    ? 'bg-green-100 text-green-700 cursor-default hover:scale-100'
                    : plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  {loading === plan.priceId ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    </span>
                  ) : (
                    buttonText
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Tableau comparatif */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Comparaison des fonctionnalités</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-medium text-slate-600">Fonctionnalité</th>
                  <th className="text-center py-4 px-4 font-semibold text-slate-900">Test</th>
                  <th className="text-center py-4 px-4 font-semibold text-indigo-600 bg-indigo-50">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-600">Max</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 px-6 text-sm text-slate-700">{feature.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.test === 'boolean' ? (
                        feature.test ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{feature.test}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-indigo-50/50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium text-indigo-600">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.max === 'boolean' ? (
                        feature.max ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-medium text-purple-600">{feature.max}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Paiement sécurisé par Stripe • Annulation à tout moment</p>
        </div>
      </div>
    </main>
  )
}
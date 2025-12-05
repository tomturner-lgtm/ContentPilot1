'use client'

import Link from 'next/link'
import { useQuota } from '@/hooks/useQuota'
import { usePlan } from '@/hooks/usePlan'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const PLAN_NAMES: Record<string, string> = {
  free: 'Gratuit',
  test: 'Test',
  pro: 'Pro',
  max: 'Max',
}

export default function Header() {
  const quota = useQuota()
  const plan = usePlan()
  const { isDark, toggleDarkMode } = useDarkMode()
  const [showAlert, setShowAlert] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const supabase = createClientComponentClient()

  // Vérifier la session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Afficher l'alerte s'il ne reste qu'1 article
  useEffect(() => {
    if (quota.remaining === 1 && !quota.isLoading) {
      setShowAlert(true)
      const timer = setTimeout(() => setShowAlert(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [quota.remaining, quota.isLoading])

  if (quota.isLoading) {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
              ContentPilot
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors">
                ContentPilot
              </Link>
              <Link href="/articles" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Mes Articles
              </Link>
              <Link href="/integrations" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Intégrations
              </Link>
              <Link href="/pricing" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Tarifs
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Plan actuel */}
              <div className="hidden sm:block">
                <span className={`text-xs font-semibold tracking-wide ${plan.currentPlanType === 'pro' ? 'bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full' : 'text-slate-500'}`}>
                  {plan.currentPlanType === 'pro' ? 'PRO' : `Plan ${PLAN_NAMES[plan.currentPlanType]}`}
                </span>
              </div>

              {/* Badge de quota */}
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {plan.isUnlimited() ? (
                      <>{quota.count} articles générés</>
                    ) : (
                      <>{quota.count}/{quota.limit} articles utilisés</>
                    )}
                  </span>
                </div>
                {!plan.isUnlimited() && (
                  <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-indigo-600 transition-all duration-300 rounded-full" style={{ width: `${quota.usagePercentage}%` }} />
                  </div>
                )}
              </div>

              {/* Version mobile */}
              <div className="sm:hidden flex items-center gap-2">
                <span className={`text-xs ${plan.currentPlanType === 'pro' ? 'bg-primary-100 text-primary-700 px-2 py-1 rounded font-semibold' : 'text-gray-500'}`}>
                  {plan.currentPlanType === 'pro' ? 'PRO' : PLAN_NAMES[plan.currentPlanType]}
                </span>
                <div className="px-3 py-1.5 bg-primary-50 rounded-lg">
                  <span className="text-xs font-medium text-primary-700">
                    {plan.isUnlimited() ? quota.count : `${quota.count}/${quota.limit}`}
                  </span>
                </div>
              </div>

              {/* Bouton Connexion / Profil */}
              {isLoggedIn ? (
                <Link href="/profile" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-all">
                  Mon Profil
                </Link>
              ) : (
                <Link href="/login" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-all">
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Alerte quand il reste 1 article */}
      {showAlert && plan.currentPlanType === 'free' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              ⚠️ Il ne vous reste plus qu'1 article ce mois-ci !
            </p>
            <Link href="/pricing" className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline">
              Passer au Pro
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import Link from 'next/link'
import { useQuota } from '@/hooks/useQuota'
import { usePlan } from '@/hooks/usePlan'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useEffect, useState } from 'react'

const PLAN_NAMES: Record<string, string> = {
  free: 'Gratuit',
  pro: 'Pro',
  max: 'Max',
}

export default function Header() {
  const quota = useQuota()
  const plan = usePlan()
  const { isDark, toggleDarkMode } = useDarkMode()
  const [showAlert, setShowAlert] = useState(false)

  // Afficher l'alerte s'il ne reste qu'1 article
  useEffect(() => {
    if (quota.remaining === 1 && !quota.isLoading) {
      setShowAlert(true)
      // Cacher l'alerte après 5 secondes
      const timer = setTimeout(() => setShowAlert(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [quota.remaining, quota.isLoading])

  if (quota.isLoading) {
    return (
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900">
              ContentFlow
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
                ContentFlow
              </Link>
              <Link
                href="/articles"
                className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Mes Articles
              </Link>
              <Link
                href="/integrations"
                className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Intégrations
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Plan actuel */}
              <div className="hidden sm:block">
                <span className={`text-xs font-medium ${
                  plan.currentPlanType === 'pro' 
                    ? 'bg-primary-100 text-primary-700 px-2 py-1 rounded font-semibold' 
                    : 'text-gray-500'
                }`}>
                  {plan.currentPlanType === 'pro' ? 'PRO' : `Plan ${PLAN_NAMES[plan.currentPlanType]}`}
                </span>
              </div>

              {/* Badge de quota */}
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {plan.isUnlimited() ? (
                      <>{quota.count} articles générés</>
                    ) : (
                      <>{quota.count}/{quota.limit} articles utilisés</>
                    )}
                  </span>
                </div>
                {/* Barre de progression */}
                {!plan.isUnlimited() && (
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${quota.usagePercentage}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Version mobile */}
              <div className="sm:hidden flex items-center gap-2">
                <span className={`text-xs ${
                  plan.currentPlanType === 'pro' 
                    ? 'bg-primary-100 text-primary-700 px-2 py-1 rounded font-semibold' 
                    : 'text-gray-500'
                }`}>
                  {plan.currentPlanType === 'pro' ? 'PRO' : PLAN_NAMES[plan.currentPlanType]}
                </span>
                <div className="px-3 py-1.5 bg-primary-50 rounded-lg">
                  <span className="text-xs font-medium text-primary-700">
                    {plan.isUnlimited() ? quota.count : `${quota.count}/${quota.limit}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Alerte quand il reste 1 article (seulement pour plan gratuit) */}
      {showAlert && plan.currentPlanType === 'free' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-yellow-600"
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
              <p className="text-sm text-yellow-800">
                Il vous reste <strong>1 article gratuit</strong> ce mois-ci.
              </p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-yellow-600 hover:text-yellow-800"
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
        </div>
      )}
    </>
  )
}

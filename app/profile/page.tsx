'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface UserData {
  id: string
  email: string
}

interface QuotaData {
  plan: string
  articlesUsed: number
  articlesLimit: number
  articlesRemaining: number
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<UserData | null>(null)
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
      })

      // Fetch quota
      try {
        const response = await fetch('/api/user/check-quota')
        if (response.ok) {
          const data = await response.json()
          setQuota(data)
        }
      } catch (err) {
        console.error('Error fetching quota:', err)
      }

      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const getPlanName = (planType: string) => {
    const planNames: Record<string, string> = {
      free: 'Gratuit',
      test: 'Test',
      pro: 'Pro',
      unlimited: 'Max',
      max: 'Max',
    }
    return planNames[planType] || planType
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="mb-8">
          <Link href="/" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Mon Profil</h1>
          <p className="text-slate-500">Gérez vos informations et consultez votre abonnement</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {/* Informations */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Mes Informations</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">Email</label>
                <p className="text-slate-900 font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">ID Utilisateur</label>
                <p className="text-slate-600 text-sm font-mono break-all">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Abonnement */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Mon Abonnement</h2>
            {quota ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500 block mb-1">Plan actuel</label>
                  <span className="text-lg font-bold text-slate-900">{getPlanName(quota.plan)}</span>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-500 block mb-1">Articles utilisés</label>
                  <p className="text-slate-900 font-medium">
                    {quota.articlesUsed} / {quota.articlesLimit === 999999 ? '∞' : quota.articlesLimit}
                  </p>
                  {quota.articlesLimit !== 999999 && (
                    <div className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min((quota.articlesUsed / quota.articlesLimit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  Gérer mon abonnement →
                </Link>
              </div>
            ) : (
              <p className="text-slate-500">Chargement...</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSignOut}
            className="rounded-xl border border-gray-200 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </main>
  )
}

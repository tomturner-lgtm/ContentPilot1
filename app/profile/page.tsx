import { redirect } from 'next/navigation'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

// Fonction pour récupérer l'utilisateur
async function getUser() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Fonction pour récupérer l'abonnement depuis user_quotas
async function getUserSubscription(userId: string) {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: quota, error } = await supabase
    .from('user_quotas')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !quota) {
    return null
  }

  return quota
}

export default async function ProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const subscription = await getUserSubscription(user.id)

  // Formater le nom du plan
  const getPlanName = (planType: string) => {
    const planNames: Record<string, string> = {
      test: 'Test',
      pro: 'Pro',
      unlimited: 'Max',
    }
    return planNames[planType] || planType
  }

  // Formater la date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Mon Profil
          </h1>
          <p className="text-slate-500">
            Gérez vos informations et consultez votre abonnement
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {/* Carte 1: Mes Informations */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Mes Informations
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  Email
                </label>
                <p className="text-slate-900 font-medium">{user.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  ID Utilisateur
                </label>
                <p className="text-slate-600 text-sm font-mono break-all">
                  {user.id}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500 block mb-1">
                  Date d'inscription
                </label>
                <p className="text-slate-900">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Carte 2: Mon Abonnement */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <svg
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15c0-.621.504-1.125 1.125-1.125h.375M15 10.5a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75v-.75zm0 2.25a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75V12.75z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Mon Abonnement
              </h2>
            </div>

            {subscription ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-500 block mb-1">
                    Plan actuel
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      {getPlanName(subscription.plan_type)}
                    </span>
                    {subscription.plan_type === 'pro' && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        Recommandé
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-500 block mb-1">
                    Statut
                  </label>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                    Actif
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-500 block mb-1">
                    Articles utilisés
                  </label>
                  <p className="text-slate-900 font-medium">
                    {subscription.articles_used} / {subscription.articles_limit === 999999 ? '∞' : subscription.articles_limit}
                  </p>
                  {subscription.articles_limit !== 999999 && (
                    <div className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                        style={{
                          width: `${Math.min((subscription.articles_used / subscription.articles_limit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {subscription.reset_date && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 block mb-1">
                      Prochain renouvellement
                    </label>
                    <p className="text-slate-900">
                      {formatDate(subscription.reset_date)}
                    </p>
                  </div>
                )}

                {subscription.stripe_subscription_id && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 block mb-1">
                      ID Abonnement Stripe
                    </label>
                    <p className="text-slate-600 text-sm font-mono break-all">
                      {subscription.stripe_subscription_id}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Gérer mon abonnement
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-4 text-slate-600 font-medium">
                  Aucun abonnement actif
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Choisissez un plan pour commencer à générer des articles
                </p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 hover:scale-[1.02] transition-all duration-200"
                >
                  Voir les plans
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de déconnexion */}
        <div className="mt-8 flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}


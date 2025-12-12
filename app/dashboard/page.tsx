'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Sparkles, FileText, CreditCard, Settings, TrendingUp, Clock, ChevronRight } from 'lucide-react'
import { PLAN_LIMITS, PlanType } from '@/hooks/usePlan'
import { clearUserCache } from '@/lib/auth-utils'

interface UserProfile {
    profile: {
        first_name: string | null
        last_name: string | null
        email: string
        company_name: string | null
        website_url: string | null
        onboarding_completed: boolean
    }
    subscription: {
        plan_type: string
        billing_period: string
        articles_limit: number
        articles_used: number
        articles_remaining: number
        reset_date: string | null
    }
    stats: {
        total_articles: number
        one_time_credits: number
    }
    can_generate: boolean
}

const PLAN_NAMES: Record<string, string> = {
    free: 'Gratuit',
    test: 'Test',
    pro: 'Pro',
    max: 'Max',
}

const PLAN_COLORS: Record<string, string> = {
    free: 'bg-slate-100 text-slate-700',
    test: 'bg-amber-100 text-amber-700',
    pro: 'bg-indigo-100 text-indigo-700',
    max: 'bg-purple-100 text-purple-700',
}

export default function DashboardPage() {
    const router = useRouter()
    const supabase = createClientComponentClient()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [greeting, setGreeting] = useState('')
    // Subscription management state
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelLoading, setCancelLoading] = useState(false)
    const [cancelMessage, setCancelMessage] = useState('')
    const [cancelError, setCancelError] = useState('')
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
        // Définir le message de salutation selon l'heure
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Bonjour')
        else if (hour < 18) setGreeting('Bon après-midi')
        else setGreeting('Bonsoir')
    }, [])

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.push('/login?redirect=/dashboard')
                return
            }

            try {
                // Récupérer les données depuis la table users directement
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('auth_id', session.user.id)
                    .single()

                if (userError || !userData) {
                    console.error('Error fetching user:', userError)
                    // Créer un profil par défaut si erreur
                    setProfile({
                        profile: {
                            first_name: session.user.email?.split('@')[0] || 'Utilisateur',
                            last_name: null,
                            email: session.user.email || '',
                            company_name: null,
                            website_url: null,
                            onboarding_completed: false,
                        },
                        subscription: {
                            plan_type: 'free',
                            billing_period: 'monthly',
                            articles_limit: 0,
                            articles_used: 0,
                            articles_remaining: 0,
                            reset_date: null,
                        },
                        stats: {
                            total_articles: 0,
                            one_time_credits: 0,
                        },
                        can_generate: false,
                    })
                } else {
                    // Compter les articles générés (utiliser session.user.id car c'est l'auth_id stocké)
                    const { count: articlesCount } = await supabase
                        .from('articles')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userData.id)  // Utiliser l'ID interne, pas l'auth_id

                    console.log('📊 Dashboard data:', {
                        userId: userData.id,
                        authId: session.user.id,
                        plan: userData.plan,
                        articlesUsed: userData.articles_used,
                        articlesLimit: userData.articles_limit,
                        totalArticles: articlesCount
                    })

                    // Mapper les données utilisateur au format attendu
                    const planType = userData.plan || 'free'
                    const articlesLimit = userData.articles_limit || 0
                    const articlesUsed = userData.articles_used || 0

                    setProfile({
                        profile: {
                            first_name: userData.first_name || userData.email?.split('@')[0] || 'Utilisateur',
                            last_name: userData.last_name || null,
                            email: userData.email || session.user.email || '',
                            company_name: userData.company_name || null,
                            website_url: userData.website_url || null,
                            onboarding_completed: userData.onboarding_completed || false,
                        },
                        subscription: {
                            plan_type: planType,
                            billing_period: userData.billing_period || 'monthly',
                            articles_limit: articlesLimit,
                            articles_used: articlesUsed,
                            articles_remaining: Math.max(0, articlesLimit - articlesUsed),
                            reset_date: userData.quota_reset_date || null,
                        },
                        stats: {
                            total_articles: articlesCount || 0,
                            one_time_credits: 0,
                        },
                        can_generate: articlesLimit > articlesUsed,
                    })
                    // Set raw userData for subscription management
                    setUserData(userData)
                }
            } catch (err) {
                console.error('Error:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [supabase, router])

    const handleSignOut = async () => {
        // Nettoyer TOUT le cache utilisateur
        clearUserCache()
        await supabase.auth.signOut()
        // Force hard reload vers login pour nettoyer tous les états
        window.location.href = '/login'
    }

    const handleCancelSubscription = async () => {
        if (!userData?.id) return

        setCancelLoading(true)
        setCancelError('')
        setCancelMessage('')

        try {
            const response = await fetch('/api/subscription/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userData.id }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'annulation')
            }

            setCancelMessage(data.message)
            setShowCancelModal(false)
            router.refresh()
            // Reload to get fresh data
            window.location.reload()
        } catch (err: any) {
            setCancelError(err.message)
        } finally {
            setCancelLoading(false)
        }
    }

    const handleReactivateSubscription = async () => {
        if (!userData?.id) return

        setCancelLoading(true)
        setCancelError('')
        setCancelMessage('')

        try {
            const response = await fetch('/api/subscription/reactivate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userData.id }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la réactivation')
            }

            setCancelMessage(data.message)
            window.location.reload()
        } catch (err: any) {
            setCancelError(err.message)
        } finally {
            setCancelLoading(false)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Chargement...</p>
                </div>
            </main>
        )
    }

    if (!profile) return null

    const firstName = profile.profile.first_name || 'là'
    const hasSubscription = profile.subscription.plan_type !== 'free'
    const totalCredits = profile.subscription.articles_remaining + profile.stats.one_time_credits

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
                {/* Header avec salutation personnalisée */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                        {greeting}, {firstName} 👋
                    </h1>
                    <p className="text-slate-500">
                        Bienvenue sur votre tableau de bord ContentPilot
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    {/* Plan actuel */}
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                                <CreditCard className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${PLAN_COLORS[profile.subscription.plan_type]}`}>
                                {PLAN_NAMES[profile.subscription.plan_type]}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Mon plan</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {hasSubscription ? `${profile.subscription.articles_limit} articles/mois` : 'Aucun abonnement'}
                        </p>
                    </div>

                    {/* Crédits disponibles */}
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                                <Sparkles className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Crédits disponibles</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {totalCredits} article{totalCredits !== 1 ? 's' : ''}
                        </p>
                        {profile.stats.one_time_credits > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                                dont {profile.stats.one_time_credits} achat(s) ponctuel(s)
                            </p>
                        )}
                    </div>

                    {/* Articles générés */}
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Articles générés</p>
                        <p className="text-2xl font-bold text-slate-900">{profile.stats.total_articles}</p>
                        <p className="text-xs text-slate-500 mt-1">au total</p>
                    </div>

                    {/* Utilisés ce mois */}
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                                <TrendingUp className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Utilisés ce mois</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {profile.subscription.articles_used}/{PLAN_LIMITS[profile.subscription.plan_type as PlanType] || profile.subscription.articles_limit || '∞'}
                        </p>
                        {hasSubscription && (PLAN_LIMITS[profile.subscription.plan_type as PlanType] || profile.subscription.articles_limit) > 0 && (
                            <div className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 rounded-full transition-all"
                                    style={{ width: `${Math.min((profile.subscription.articles_used / (PLAN_LIMITS[profile.subscription.plan_type as PlanType] || profile.subscription.articles_limit)) * 100, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA et Actions */}
                <div className="grid gap-6 lg:grid-cols-3 mb-8">
                    {/* CTA Générer */}
                    <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white">
                        <h2 className="text-2xl font-bold mb-2">Prêt à créer du contenu ?</h2>
                        <p className="text-indigo-100 mb-6">
                            {profile.can_generate
                                ? 'Générez des articles SEO optimisés en quelques clics.'
                                : 'Obtenez des crédits pour commencer à générer des articles.'}
                        </p>
                        {profile.can_generate ? (
                            <Link
                                href="/generate"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all"
                            >
                                <Sparkles className="h-5 w-5" />
                                Générer un article
                            </Link>
                        ) : (
                            <Link
                                href="/pricing"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-all"
                            >
                                Voir les offres
                                <ChevronRight className="h-5 w-5" />
                            </Link>
                        )}
                    </div>

                    {/* Raccourcis */}
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Raccourcis</h3>
                        <div className="space-y-3">
                            <Link href="/articles" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <FileText className="h-5 w-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">Mes articles</span>
                                <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                            </Link>
                            <Link href="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <Settings className="h-5 w-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">Mon profil</span>
                                <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                            </Link>
                            <Link href="/pricing" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">Gérer mon abonnement</span>
                                <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Subscription Management Section */}
                {/* Show if plan is NOT free AND status is NOT canceling AND NOT canceled */}
                {/* We rely on plan status, assuming if they have a plan, they should be able to manage it */}
                {userData?.plan && userData?.plan !== 'free' &&
                    userData?.stripe_subscription_status !== 'canceling' &&
                    userData?.stripe_subscription_status !== 'canceled' && (
                        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 mb-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Gérer mon abonnement</h3>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-slate-900">
                                        Plan {userData.plan === 'pro' ? 'Pro' : userData.plan === 'max' ? 'Max' : userData.plan}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        Facturation {userData.billing_period === 'yearly' ? 'annuelle' : 'mensuelle'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">Status: {userData.stripe_subscription_status || 'actif'}</p>
                                </div>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                                >
                                    Annuler l&apos;abonnement
                                </button>
                            </div>

                            {cancelError && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">{cancelError}</p>
                                </div>
                            )}

                            {cancelMessage && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">{cancelMessage}</p>
                                </div>
                            )}
                        </div>
                    )}

                {/* Debug Info - Visible only if profile loaded */}
                <div className="opacity-50 hover:opacity-100 transition-opacity mb-8">
                    <details className="p-4 bg-slate-100 rounded-xl text-xs font-mono text-slate-600 overflow-auto">
                        <summary className="cursor-pointer font-bold mb-2">Diagnostic Abonnement (Debug)</summary>
                        <div className="space-y-1">
                            <p>User ID: {userData?.id}</p>
                            <p>Plan: {userData?.plan}</p>
                            <p>Sub ID: {userData?.stripe_subscription_id ? 'Présent' : 'MANQUANT'}</p>
                            <p>Sub ID Value: {userData?.stripe_subscription_id}</p>
                            <p>Status: {userData?.stripe_subscription_status}</p>
                            <p>Condition Affichage: {userData?.stripe_subscription_id ? 'OK ID' : 'NO ID'} && {userData?.stripe_subscription_status !== 'canceling' ? 'OK Status' : 'NO Status'}</p>
                        </div>
                    </details>
                </div>

                {/* Canceling Subscription Banner */}
                {userData?.stripe_subscription_status === 'canceling' && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 mb-6">
                        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Abonnement en cours d&apos;annulation</h3>
                        <p className="text-amber-800 mb-4">
                            Votre abonnement sera annulé à la fin de votre période de facturation actuelle.
                            Vous conservez l&apos;accès à toutes les fonctionnalités jusqu&apos;à cette date.
                        </p>
                        <button
                            onClick={handleReactivateSubscription}
                            disabled={cancelLoading}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
                        >
                            {cancelLoading ? 'Réactivation...' : 'Réactiver mon abonnement'}
                        </button>

                        {cancelMessage && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">{cancelMessage}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer avec infos profil */}
                <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500">Connecté en tant que</p>
                            <p className="font-medium text-slate-900">{profile.profile.email}</p>
                            {profile.profile.company_name && (
                                <p className="text-sm text-slate-500">{profile.profile.company_name}</p>
                            )}
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                        >
                            Se déconnecter
                        </button>
                    </div>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                            Confirmer l&apos;annulation
                        </h3>
                        <p className="text-slate-600 mb-6">
                            Êtes-vous sûr de vouloir annuler votre abonnement ?
                            Vous conserverez l&apos;accès jusqu&apos;à la fin de votre période de facturation actuelle.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                                disabled={cancelLoading}
                            >
                                Non, garder mon abonnement
                            </button>
                            <button
                                onClick={handleCancelSubscription}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-medium"
                                disabled={cancelLoading}
                            >
                                {cancelLoading ? 'Annulation...' : 'Oui, annuler'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

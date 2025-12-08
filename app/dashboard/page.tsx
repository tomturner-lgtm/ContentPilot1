'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Sparkles, FileText, CreditCard, Settings, TrendingUp, Clock, ChevronRight } from 'lucide-react'
import { PLAN_LIMITS, PlanType } from '@/hooks/usePlan'

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
                        .eq('user_id', session.user.id)

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
        // Nettoyer le localStorage (cache du plan et quota)
        localStorage.removeItem('contentflow_plan')
        localStorage.removeItem('contentflow_quota')
        await supabase.auth.signOut()
        // Force hard reload vers login pour nettoyer tous les états
        window.location.href = '/login'
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
        </main>
    )
}

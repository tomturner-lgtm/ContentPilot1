'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth-client'

interface QuotaData {
    canGenerate: boolean
    plan: string
    articlesUsed: number
    articlesLimit: number
    articlesRemaining: number
    resetDate: string
    oneTimePurchasesAvailable: number
    hasUnlimited: boolean
}

export default function DashboardPage() {
    const router = useRouter()
    const { data: session, isPending } = useSession()
    const [quota, setQuota] = useState<QuotaData | null>(null)
    const [quotaLoading, setQuotaLoading] = useState(true)
    const [quotaError, setQuotaError] = useState<string | null>(null)

    // Rediriger si non connecté
    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login?redirect=/dashboard')
        }
    }, [session, isPending, router])

    // Charger le quota
    useEffect(() => {
        const fetchQuota = async () => {
            if (!session) return

            try {
                const response = await fetch('/api/user/check-quota')
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération du quota')
                }
                const data = await response.json()
                setQuota(data)
            } catch (err: any) {
                setQuotaError(err.message)
            } finally {
                setQuotaLoading(false)
            }
        }

        if (session) {
            fetchQuota()
        }
    }, [session])

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    // Loading state
    if (isPending) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Chargement...</p>
                </div>
            </main>
        )
    }

    // Non connecté (sera redirigé)
    if (!session) {
        return null
    }

    const user = session.user

    // Calculer si quota épuisé
    const isQuotaExhausted = quota && !quota.canGenerate

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
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
                            Tableau de bord
                        </h1>
                        <p className="text-slate-500">
                            Bienvenue, {user.name || user.email}
                        </p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                    >
                        Se déconnecter
                    </button>
                </div>

                {/* Bandeau quota épuisé */}
                {isQuotaExhausted && (
                    <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                                    <svg
                                        className="h-5 w-5 text-amber-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-amber-900">Quota épuisé</h3>
                                    <p className="text-sm text-amber-700">
                                        Vous avez utilisé tous vos articles ce mois-ci.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/pricing"
                                className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-all"
                            >
                                Acheter des crédits
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                    {/* Carte Infos utilisateur */}
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
                                Mon Compte
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {user.name && (
                                <div>
                                    <label className="text-sm font-medium text-slate-500 block mb-1">
                                        Nom
                                    </label>
                                    <p className="text-slate-900 font-medium">{user.name}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-slate-500 block mb-1">
                                    Email
                                </label>
                                <p className="text-slate-900 font-medium">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Carte Quota */}
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
                                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                Mon Quota
                            </h2>
                        </div>

                        {quotaLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : quotaError ? (
                            <div className="text-center py-8">
                                <p className="text-red-600">{quotaError}</p>
                            </div>
                        ) : quota ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-500 block mb-1">
                                        Plan actuel
                                    </label>
                                    <p className="text-slate-900 font-medium capitalize">{quota.plan}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500 block mb-1">
                                        Articles utilisés
                                    </label>
                                    <p className="text-slate-900 font-medium">
                                        {quota.articlesUsed} / {quota.hasUnlimited ? '∞' : quota.articlesLimit}
                                    </p>
                                    {!quota.hasUnlimited && (
                                        <div className="mt-2 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                                                style={{
                                                    width: `${Math.min((quota.articlesUsed / quota.articlesLimit) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500 block mb-1">
                                        Articles restants
                                    </label>
                                    <p className="text-2xl font-bold text-indigo-600">
                                        {quota.hasUnlimited ? '∞' : quota.articlesRemaining}
                                    </p>
                                </div>
                                {quota.oneTimePurchasesAvailable > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-slate-500 block mb-1">
                                            Crédits bonus
                                        </label>
                                        <p className="text-slate-900 font-medium">
                                            {quota.oneTimePurchasesAvailable} article(s)
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Bouton Générer un article */}
                <div className="mt-8 text-center">
                    <Link
                        href="/generate"
                        className={`inline-flex items-center justify-center gap-3 rounded-2xl px-10 py-5 text-lg font-semibold shadow-lg transition-all duration-200 ${isQuotaExhausted
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]'
                            }`}
                        onClick={(e) => {
                            if (isQuotaExhausted) {
                                e.preventDefault()
                            }
                        }}
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        Générer un article
                    </Link>
                    {isQuotaExhausted && (
                        <p className="mt-4 text-sm text-slate-500">
                            Achetez des crédits pour continuer à générer des articles
                        </p>
                    )}
                </div>

                {/* Liens rapides */}
                <div className="mt-12 flex justify-center gap-6">
                    <Link
                        href="/articles"
                        className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        Mes articles →
                    </Link>
                    <Link
                        href="/pricing"
                        className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        Voir les tarifs →
                    </Link>
                    <Link
                        href="/profile"
                        className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        Mon profil →
                    </Link>
                </div>
            </div>
        </main>
    )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const redirectTo = searchParams.get('redirect') || '/dashboard'
        router.push(redirectTo)
      }
    }
    checkSession()
  }, [supabase, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        // INSCRIPTION via API serveur
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, firstName }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de l\'inscription')
        }

        // Connexion automatique après inscription
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.')
        } else {
          const redirectTo = searchParams.get('redirect') || '/dashboard'
          router.push(redirectTo)
          router.refresh()
        }
      } else {
        // CONNEXION classique
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        const redirectTo = searchParams.get('redirect') || '/dashboard'
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect')
      } else if (err.message.includes('already')) {
        setError('Cet email est déjà utilisé. Connectez-vous plutôt.')
      } else {
        setError(err.message || 'Une erreur est survenue')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ContentPilot
            </h1>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            {isSignUp ? 'Créer un compte' : 'Bon retour !'}
          </h2>
          <p className="text-slate-500">
            {isSignUp ? 'Rejoignez des milliers de créateurs de contenu' : 'Connectez-vous à votre espace'}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {isSignUp && (
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                  Prénom
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isSignUp}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Jean"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              {isSignUp && (
                <p className="text-xs text-slate-500 mt-1">Minimum 6 caractères</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Chargement...
                </span>
              ) : (
                isSignUp ? 'Créer mon compte' : 'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setSuccess(null)
              }}
              className="text-sm text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  )
}

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const redirectTo = searchParams.get('redirect') || '/profile'
        router.push(redirectTo)
      }
    }
    checkSession()
  }, [supabase, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (signUpError) throw signUpError
        setError('Vérifiez votre email pour confirmer votre inscription.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        const redirectTo = searchParams.get('redirect') || '/profile'
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ContentPilot
            </h1>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            {isSignUp ? 'Créer un compte' : 'Se connecter'}
          </h2>
          <p className="text-slate-500">
            {isSignUp ? 'Rejoignez ContentPilot' : 'Accédez à votre espace personnel'}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`rounded-xl p-4 ${error.includes('Vérifiez') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${error.includes('Vérifiez') ? 'text-green-800' : 'text-red-800'}`}>{error}</p>
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
                placeholder="votre@email.com"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-slate-800 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
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
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Save, User, Building, Globe, Mail } from 'lucide-react'

interface ProfileData {
  first_name: string
  last_name: string
  email: string
  company_name: string
  website_url: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    website_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login?redirect=/profile')
        return
      }

      // Récupérer le profil depuis la base de données
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || session.user.email || '',
          company_name: data.company_name || '',
          website_url: data.website_url || '',
        })
      } else {
        // Profil n'existe pas encore, utiliser les données de session
        setProfile({
          first_name: '',
          last_name: '',
          email: session.user.email || '',
          company_name: '',
          website_url: '',
        })
      }

      setLoading(false)
    }

    fetchProfile()
  }, [supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: session.user.id,
          email: profile.email,
          first_name: profile.first_name || null,
          last_name: profile.last_name || null,
          company_name: profile.company_name || null,
          website_url: profile.website_url || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-flex items-center gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Mon profil</h1>
          <p className="text-slate-500">Gérez vos informations personnelles</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-slate-400" />
              Informations personnelles
            </h2>

            {message && (
              <div className={`rounded-xl p-4 mb-6 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message.text}</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Jean"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-500 bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">L'email ne peut pas être modifié</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Building className="h-5 w-5 text-slate-400" />
              Entreprise (optionnel)
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={profile.company_name}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Ma Startup SAS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Site web
                </label>
                <input
                  type="url"
                  value={profile.website_url}
                  onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="https://mon-site.fr"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
            >
              Se déconnecter
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

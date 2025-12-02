# Prompt Lovable - Mise à Jour Frontend ContentPilot

## 🎯 CONTEXTE

Le backend a été entièrement migré vers Supabase (PostgreSQL + Edge Functions). Le frontend doit être mis à jour pour utiliser Supabase Auth et les nouveaux endpoints API. **Aucun changement de design n'est nécessaire** - uniquement les fonctionnalités et l'intégration backend.

---

## 🔄 CHANGEMENTS MAJEURS

### 1. Authentification
- **Avant** : Pas d'authentification
- **Maintenant** : Supabase Auth (email/password)
- Tous les utilisateurs doivent se connecter pour utiliser l'application

### 2. Plans et Quotas
- **Avant** : Plan gratuit (1 article/mois) + localStorage
- **Maintenant** : 
  - Plan test à 5€ (1 article, achat unique)
  - Plan Pro (10 articles/mois) - mensuel ou annuel
  - Plan Illimité (articles illimités) - mensuel ou annuel
  - Plus de plan gratuit
  - Quotas stockés dans Supabase (table `user_quotas`)

### 3. Stockage des Articles
- **Avant** : localStorage (max 50 articles)
- **Maintenant** : Table Supabase `articles` (illimité, lié à l'utilisateur)

---

## 📦 INSTALLATION DES DÉPENDANCES

Ajouter ces packages si pas déjà présents :

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "@supabase/auth-helpers-nextjs": "^0.8.7"
}
```

---

## 🔧 CONFIGURATION SUPABASE CLIENT

### Créer un fichier `lib/supabase.ts` :

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Variables d'environnement requises :

```env
NEXT_PUBLIC_SUPABASE_URL=https://ybfbfmbnlsvgyhtzctpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_TEST=price_1SVW9TCQc7L9vhgD6NrtRBK4
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1SVGLwCQc7L9vhgDOp2cw4wn
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_1SVUXJCQc7L9vhgDVShAMmE4
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY=price_1SVGMbCQc7L9vhgDuc2zUVyS
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY=price_1SVUXXCQc7L9vhgDEkMjivDk
NEXT_PUBLIC_APP_URL=https://contentpilot1-production.up.railway.app
```

---

## 🔐 AUTHENTIFICATION

### Créer un composant `components/AuthModal.tsx` :

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }
      onClose()
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full mb-4 p-2 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            className="w-full mb-4 p-2 border rounded"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded"
          >
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-4 text-sm text-gray-600"
        >
          {isLogin ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
        <button onClick={onClose} className="mt-2 text-sm text-gray-600">
          Fermer
        </button>
      </div>
    </div>
  )
}
```

---

## 📄 MISE À JOUR DES PAGES

### 1. Layout / Header

**Fichier** : `app/layout.tsx` ou `components/Header.tsx`

**Changements** :
- Ajouter un état d'authentification avec Supabase
- Afficher le nom/email de l'utilisateur ou bouton "Se connecter"
- Badge de quota connecté à Supabase (appeler `/api/user/check-quota`)
- Bouton de déconnexion

**Code à ajouter** :

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { AuthModal } from '@/components/AuthModal'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [quota, setQuota] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Vérifier l'utilisateur
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchQuota()
    })

    // Écouter les changements d'auth
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchQuota()
    })
  }, [])

  const fetchQuota = async () => {
    const res = await fetch('/api/user/check-quota')
    const data = await res.json()
    setQuota(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <header>
      {/* Navigation */}
      {user ? (
        <>
          <span>{user.email}</span>
          {quota && (
            <div>
              Plan: {quota.plan} | {quota.articlesUsed}/{quota.articlesLimit}
            </div>
          )}
          <button onClick={handleLogout}>Déconnexion</button>
        </>
      ) : (
        <button onClick={() => setShowAuth(true)}>Se connecter</button>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </header>
  )
}
```

---

### 2. Page Pricing (`/app/pricing/page.tsx`)

**Changements** :
- ✅ **DÉJÀ FAIT** - La fonction `handleCheckout` utilise `/api/stripe/checkout`
- ✅ **DÉJÀ FAIT** - Plan test à 5€ remplace le plan gratuit
- ✅ **DÉJÀ FAIT** - Gestion des plans Pro et Illimité (mensuel/annuel)

**Vérifier** :
- Les variables d'environnement `NEXT_PUBLIC_STRIPE_PRICE_*` sont utilisées
- Les boutons appellent correctement `handleCheckout` avec le bon `priceId`
- Le toggle mensuel/annuel fonctionne

---

### 3. Page Generate (`/app/generate/page.tsx`)

**Changements** :

1. **Vérification d'authentification** :
   - Si l'utilisateur n'est pas connecté, afficher le modal d'auth
   - Empêcher la génération si non connecté

2. **Vérification de quota** :
   - ✅ **DÉJÀ FAIT** - Appeler `/api/user/check-quota` avant génération
   - Rediriger vers `/pricing` si quota épuisé

3. **Génération d'article** :
   - Appeler `/api/generate` (qui utilise Supabase Edge Function)
   - La réponse contient `{ article, articleId, quota }`
   - Sauvegarder l'article dans Supabase (via l'API, pas localStorage)

**Code à ajouter/modifier** :

```typescript
const [user, setUser] = useState<any>(null)
const supabase = createClient()

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    setUser(user)
    if (!user) {
      // Rediriger ou afficher modal auth
    }
  })
}, [])

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // 1. Vérifier authentification
  if (!user) {
    alert('Veuillez vous connecter pour générer un article')
    return
  }

  // 2. Vérifier quota (déjà fait)
  const quotaRes = await fetch('/api/user/check-quota')
  const quotaData = await quotaRes.json()
  
  if (!quotaData.canGenerate) {
    alert('Limite atteinte! Passez au plan Pro ou achetez un test à 5€.')
    router.push('/pricing')
    return
  }

  // 3. Générer l'article
  setLoading(true)
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, keyword, length, template, language }),
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }

    // L'article est déjà sauvegardé dans Supabase par l'API
    setArticle(data.article)
    
    // Mettre à jour le quota affiché
    const newQuota = await fetch('/api/user/check-quota')
    const quotaUpdate = await newQuota.json()
    // Mettre à jour l'état du quota
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

---

### 4. Page Articles (`/app/articles/page.tsx`)

**Changements** :
- Remplacer localStorage par Supabase
- Récupérer les articles depuis la table `articles` via Supabase client
- Filtrer par `user_id`

**Code à remplacer** :

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchArticles()
    })
  }, [])

  const fetchArticles = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching articles:', error)
    } else {
      setArticles(data || [])
    }
    setLoading(false)
  }

  if (!user) {
    return <div>Veuillez vous connecter pour voir vos articles</div>
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  return (
    <div>
      <h1>Mes Articles</h1>
      {articles.length === 0 ? (
        <p>Aucun article généré</p>
      ) : (
        <div>
          {articles.map((article) => (
            <Link key={article.id} href={`/articles/${article.id}`}>
              <div>
                <h3>{article.title}</h3>
                <p>Mot-clé: {article.keyword}</p>
                <p>Date: {new Date(article.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 5. Page Article Detail (`/app/articles/[id]/page.tsx`)

**Changements** :
- Récupérer l'article depuis Supabase au lieu de localStorage
- Vérifier que l'article appartient à l'utilisateur connecté

**Code à modifier** :

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'

export default function ArticleDetailPage() {
  const params = useParams()
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user && params.id) {
        fetchArticle(params.id as string)
      }
    })
  }, [params.id])

  const fetchArticle = async (articleId: string) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching article:', error)
    } else {
      setArticle(data)
    }
    setLoading(false)
  }

  if (!user) {
    return <div>Veuillez vous connecter</div>
  }

  if (loading) {
    return <div>Chargement...</div>
  }

  if (!article) {
    return <div>Article non trouvé</div>
  }

  return (
    <div>
      <h1>{article.title}</h1>
      <ReactMarkdown>{article.content}</ReactMarkdown>
      {/* Boutons d'export */}
    </div>
  )
}
```

---

### 6. Page Success (`/app/success/page.tsx`)

**Changements** :
- Lire `session_id` depuis l'URL
- Appeler `/api/stripe/handle-payment-success` pour valider le paiement one-time
- Afficher un message de confirmation

**Code à ajouter** :

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      handlePaymentSuccess(sessionId)
    }
  }, [])

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/handle-payment-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const data = await response.json()
      setSuccess(data.success)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Validation du paiement...</div>
  }

  return (
    <div>
      {success ? (
        <>
          <h1>Paiement réussi !</h1>
          <p>Vous pouvez maintenant générer 1 article.</p>
          <Link href="/generate">Générer un article</Link>
        </>
      ) : (
        <>
          <h1>Erreur</h1>
          <p>Le paiement n'a pas pu être validé.</p>
          <Link href="/pricing">Retour aux tarifs</Link>
        </>
      )}
    </div>
  )
}
```

---

## 🔌 ENDPOINTS API DISPONIBLES

### 1. `/api/stripe/checkout` (POST)
- Crée une session Stripe Checkout
- Body: `{ priceId: string }`
- Retourne: `{ url: string }`

### 2. `/api/stripe/webhook` (POST)
- Webhook Stripe (backend only)

### 3. `/api/user/check-quota` (GET)
- Vérifie le quota de l'utilisateur
- Retourne: `{ canGenerate, plan, articlesUsed, articlesLimit, ... }`

### 4. `/api/user/sync-subscription` (POST)
- Synchronise l'abonnement Stripe avec Supabase
- Retourne: `{ message, plan, quota }`

### 5. `/api/generate` (POST)
- Génère un article (appelle Supabase Edge Function)
- Body: `{ title, keyword, length?, template?, language? }`
- Retourne: `{ article, articleId, quota }`

### 6. `/api/stripe/handle-payment-success` (POST)
- Valide un paiement one-time après redirection Stripe
- Body: `{ sessionId: string }`
- Retourne: `{ success: boolean, message?: string }`

---

## 🎯 CHECKLIST DE MISE À JOUR

### Authentification
- [ ] Créer `lib/supabase.ts` avec le client Supabase
- [ ] Créer `components/AuthModal.tsx`
- [ ] Mettre à jour le Header pour afficher l'état d'auth
- [ ] Ajouter la vérification d'auth sur toutes les pages protégées

### Pages
- [ ] **Pricing** : Vérifier que les boutons utilisent les nouveaux endpoints
- [ ] **Generate** : Ajouter vérification auth + quota avant génération
- [ ] **Articles** : Remplacer localStorage par Supabase
- [ ] **Article Detail** : Récupérer depuis Supabase
- [ ] **Success** : Valider le paiement one-time

### Hooks (si utilisés)
- [ ] Supprimer ou mettre à jour `hooks/useQuota.ts` pour utiliser Supabase
- [ ] Supprimer ou mettre à jour `hooks/useArticles.ts` pour utiliser Supabase
- [ ] Supprimer `hooks/usePlan.ts` (remplacé par Supabase)

### Variables d'environnement
- [ ] Vérifier que toutes les variables `NEXT_PUBLIC_*` sont définies
- [ ] Tester avec les vraies valeurs

---

## ⚠️ NOTES IMPORTANTES

1. **Plus de localStorage** : Tous les quotas et articles sont dans Supabase
2. **Authentification obligatoire** : Tous les utilisateurs doivent se connecter
3. **Plan gratuit supprimé** : Remplacé par test à 5€
4. **Quotas automatiques** : Gérés par Supabase, pas besoin de reset manuel
5. **Edge Functions** : Les appels à `/api/generate` passent par Supabase Edge Functions

---

## 🧪 TESTS À EFFECTUER

1. **Inscription/Connexion** : Créer un compte et se connecter
2. **Test à 5€** : Acheter le test, vérifier qu'on peut générer 1 article
3. **Abonnement Pro** : Souscrire au plan Pro, vérifier le quota (10 articles)
4. **Génération** : Générer un article, vérifier qu'il est sauvegardé dans Supabase
5. **Historique** : Voir la liste des articles depuis Supabase
6. **Quota** : Vérifier que le quota se met à jour après génération

---

**IMPORTANT** : Ne pas modifier le design existant. Seulement les fonctionnalités et l'intégration backend doivent être mises à jour.


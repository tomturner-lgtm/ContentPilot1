# Edge Functions - Spécifications Complètes

## 📋 Vue d'ensemble

Toutes les Edge Functions à créer dans Supabase pour ContentPilot.

**Note importante** : Il n'y a plus de plan gratuit. Les utilisateurs peuvent tester avec un achat unique de 5€ (1 article), puis souscrire à un plan payant.

---

## 🔧 Edge Functions Requises

### 1. `generate` (verify_jwt = true)

**Description** : Génère un article avec OpenAI après vérification du quota/achat.

**Méthode** : POST

**Authentification** : Requise (JWT)

**Paramètres du body** :
```typescript
{
  title: string;        // Requis
  keyword: string;     // Requis
  length?: number;      // Optionnel, défaut: 1000
  template?: string;    // Optionnel: 'blog-classic' | 'review' | 'how-to' | 'list' | 'comparison'
  language?: string;    // Optionnel, défaut: 'fr'
}
```

**Logique** :
1. Vérifier l'authentification (JWT)
2. Récupérer `user_id` depuis le JWT
3. Appeler la fonction SQL `check_and_use_quota(user_id)` pour vérifier :
   - Si l'utilisateur a un achat one-time non utilisé → l'utiliser
   - Sinon, vérifier le quota de l'abonnement
   - Si quota épuisé → retourner erreur
4. Si quota OK, construire le prompt OpenAI selon les paramètres
5. Appeler OpenAI API (gpt-4o-mini)
6. Sauvegarder l'article dans la table `articles`
7. Retourner l'article généré

**Réponse succès** :
```json
{
  "article": "## Titre\n\nContenu markdown...",
  "articleId": "uuid",
  "quota": {
    "articles_used": 1,
    "articles_limit": 10,
    "type": "one_time" | "quota"
  }
}
```

**Réponse erreur** :
```json
{
  "error": "Quota épuisé. Veuillez souscrire à un plan.",
  "code": "QUOTA_EXCEEDED"
}
```

**Secrets utilisés** :
- `OPENAI_API_KEY`

---

### 2. `create-checkout` (verify_jwt = true)

**Description** : Crée une session Stripe Checkout pour un abonnement (Pro ou Illimité, mensuel ou annuel).

**Méthode** : POST

**Authentification** : Requise (JWT)

**Paramètres du body** :
```typescript
{
  priceId: string;      // Requis: price_id Stripe
  planType: string;    // Requis: 'pro' | 'unlimited'
  billingPeriod: string; // Requis: 'monthly' | 'yearly'
}
```

**Logique** :
1. Vérifier l'authentification
2. Récupérer l'email de l'utilisateur depuis le JWT ou la table `auth.users`
3. Vérifier si un `stripe_customer_id` existe dans `user_quotas`
4. Si non, créer un customer Stripe avec l'email
5. Créer une session Stripe Checkout en mode `subscription`
6. Dans les metadata, inclure :
   - `user_id`: UUID de l'utilisateur
   - `plan_type`: 'pro' | 'unlimited'
   - `billing_period`: 'monthly' | 'yearly'
7. Retourner l'URL de checkout

**Réponse succès** :
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

**Réponse erreur** :
```json
{
  "error": "Erreur lors de la création de la session"
}
```

**Secrets utilisés** :
- `STRIPE_SECRET_KEY`

---

### 3. `create-one-time-purchase` (verify_jwt = true)

**Description** : Crée une session Stripe Checkout pour un achat unique de test (5€ = 1 article).

**Méthode** : POST

**Authentification** : Requise (JWT)

**Paramètres du body** : Aucun

**Logique** :
1. Vérifier l'authentification
2. Récupérer l'email de l'utilisateur
3. Vérifier si un `stripe_customer_id` existe, sinon créer un customer
4. Créer une session Stripe Checkout en mode `payment` (pas subscription)
5. Prix fixe : 500 (5€ en centimes)
6. Dans les metadata, inclure :
   - `user_id`: UUID de l'utilisateur
   - `type`: 'one_time_purchase'
7. Retourner l'URL de checkout

**Réponse succès** :
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

**Secrets utilisés** :
- `STRIPE_SECRET_KEY`

---

### 4. `handle-payment-success` (verify_jwt = false)

**Description** : Gère le succès d'un paiement one-time après redirection depuis Stripe.

**Méthode** : POST

**Authentification** : Non requise (appelé depuis le frontend après redirection)

**Paramètres du body** :
```typescript
{
  sessionId: string;    // Requis: session_id Stripe
}
```

**Logique** :
1. Récupérer la session Stripe avec `sessionId`
2. Vérifier que `payment_status === 'paid'`
3. Vérifier que `metadata.type === 'one_time_purchase'`
4. Récupérer `user_id` depuis `metadata.user_id`
5. Insérer un nouvel enregistrement dans `one_time_purchases` :
   - `user_id`: depuis metadata
   - `used`: false
   - `stripe_payment_intent_id`: depuis la session
6. Retourner succès

**Réponse succès** :
```json
{
  "success": true,
  "message": "Achat one-time enregistré. Vous pouvez maintenant générer 1 article."
}
```

**Réponse erreur** :
```json
{
  "success": false,
  "error": "Session non trouvée ou non payée"
}
```

**Secrets utilisés** :
- `STRIPE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (pour insérer dans la table)

---

### 5. `sync-subscription` (verify_jwt = true)

**Description** : Synchronise l'abonnement Stripe avec la base de données (appelé manuellement ou après webhook).

**Méthode** : POST

**Authentification** : Requise (JWT)

**Paramètres du body** : Aucun (utilise l'utilisateur authentifié)

**Logique** :
1. Vérifier l'authentification
2. Récupérer `user_id` depuis JWT
3. Récupérer `stripe_customer_id` depuis `user_quotas`
4. Si pas de customer_id, retourner erreur
5. Lister les subscriptions actives via Stripe API
6. Pour chaque subscription active :
   - Récupérer le `price_id`
   - Mapper le `price_id` vers `plan_type` et `articles_limit` :
     - `VITE_STRIPE_PRICE_PRO_MONTHLY` → `plan_type: 'pro'`, `articles_limit: 10`
     - `VITE_STRIPE_PRICE_PRO_YEARLY` → `plan_type: 'pro'`, `articles_limit: 10`
     - `VITE_STRIPE_PRICE_UNLIMITED_MONTHLY` → `plan_type: 'unlimited'`, `articles_limit: 999999`
     - `VITE_STRIPE_PRICE_UNLIMITED_YEARLY` → `plan_type: 'unlimited'`, `articles_limit: 999999`
7. Mettre à jour `user_quotas` avec :
   - `plan_type`
   - `articles_limit`
   - `stripe_subscription_id`
   - `articles_used`: réinitialiser à 0 si nouveau plan
   - `reset_date`: maintenant + 1 mois
8. Retourner le statut

**Réponse succès** :
```json
{
  "success": true,
  "plan_type": "pro",
  "articles_limit": 10,
  "articles_used": 0,
  "reset_date": "2025-02-01T00:00:00Z"
}
```

**Réponse erreur** :
```json
{
  "success": false,
  "error": "Aucun abonnement actif trouvé"
}
```

**Secrets utilisés** :
- `STRIPE_SECRET_KEY`
- `VITE_STRIPE_PRICE_PRO_MONTHLY`
- `VITE_STRIPE_PRICE_PRO_YEARLY`
- `VITE_STRIPE_PRICE_UNLIMITED_MONTHLY`
- `VITE_STRIPE_PRICE_UNLIMITED_YEARLY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

### 6. `stripe-webhook` (verify_jwt = false)

**Description** : Webhook Stripe pour gérer les événements d'abonnement automatiquement.

**Méthode** : POST

**Authentification** : Non requise (vérification de signature Stripe)

**Headers requis** :
- `stripe-signature`: Signature Stripe pour vérification

**Logique** :
1. Vérifier la signature Stripe avec `STRIPE_WEBHOOK_SECRET`
2. Parser l'événement Stripe
3. Gérer les événements suivants :

   **`checkout.session.completed`** :
   - Si `mode === 'subscription'` :
     - Récupérer `user_id` depuis `metadata.user_id`
     - Récupérer `plan_type` depuis `metadata.plan_type`
     - Récupérer le `price_id` depuis `line_items.data[0].price.id`
     - Mapper le `price_id` vers `plan_type` et `articles_limit`
     - Créer ou mettre à jour `user_quotas` avec :
       - `plan_type`
       - `articles_limit`
       - `stripe_customer_id`: depuis `customer`
       - `stripe_subscription_id`: depuis `subscription`
       - `articles_used`: 0
       - `reset_date`: maintenant + 1 mois
   
   - Si `mode === 'payment'` et `metadata.type === 'one_time_purchase'` :
     - Récupérer `user_id` depuis `metadata.user_id`
     - Insérer dans `one_time_purchases` :
       - `user_id`
       - `used`: false
       - `stripe_payment_intent_id`: depuis `payment_intent`

   **`customer.subscription.updated`** :
   - Récupérer le `customer_id` et `subscription_id`
   - Trouver l'utilisateur dans `user_quotas` par `stripe_customer_id`
   - Mettre à jour `plan_type` et `articles_limit` selon le nouveau `price_id`

   **`customer.subscription.deleted`** :
   - Récupérer le `customer_id`
   - Trouver l'utilisateur dans `user_quotas`
   - Remettre le plan à `free` avec `articles_limit: 1` (ou supprimer le quota)
   - Mettre `stripe_subscription_id` à NULL

4. Retourner `{ received: true }`

**Réponse** :
```json
{
  "received": true
}
```

**Secrets utilisés** :
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PRICE_PRO_MONTHLY`
- `VITE_STRIPE_PRICE_PRO_YEARLY`
- `VITE_STRIPE_PRICE_UNLIMITED_MONTHLY`
- `VITE_STRIPE_PRICE_UNLIMITED_YEARLY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

### 7. `wordpress-publish` (verify_jwt = true)

**Description** : Publie un article sur WordPress via REST API.

**Méthode** : POST

**Authentification** : Requise (JWT)

**Paramètres du body** :
```typescript
{
  articleId: string;    // Requis: ID de l'article dans la table articles
  title?: string;       // Optionnel: override du titre
  content?: string;     // Optionnel: override du contenu
}
```

**Logique** :
1. Vérifier l'authentification
2. Récupérer `user_id` depuis JWT
3. Récupérer l'article depuis la table `articles` (vérifier que `user_id` correspond)
4. Récupérer la config WordPress depuis `wordpress_configs` (pour cet utilisateur)
5. Si pas de config, retourner erreur
6. Convertir le markdown en HTML (utiliser `marked` ou similaire)
7. Appeler WordPress REST API :
   - URL: `${site_url}/wp-json/wp/v2/posts`
   - Méthode: POST
   - Headers:
     - `Authorization: Basic ${base64(username:application_password)}`
   - Body:
     ```json
     {
       "title": "Titre de l'article",
       "content": "Contenu HTML",
       "status": "publish"
     }
     ```
8. Retourner le résultat

**Réponse succès** :
```json
{
  "success": true,
  "postId": 123,
  "url": "https://example.com/article-title"
}
```

**Réponse erreur** :
```json
{
  "success": false,
  "error": "Erreur lors de la publication"
}
```

**Secrets utilisés** :
- Aucun (utilise les credentials stockés dans `wordpress_configs`)

---

### 8. `wordpress-test` (verify_jwt = true)

**Description** : Teste la connexion WordPress et sauvegarde la configuration.

**Méthode** : POST

**Authentification** : Requise (JWT)

**Paramètres du body** :
```typescript
{
  siteUrl: string;              // Requis
  username: string;             // Requis
  applicationPassword: string; // Requis
}
```

**Logique** :
1. Vérifier l'authentification
2. Récupérer `user_id` depuis JWT
3. Nettoyer l'URL (enlever le slash final)
4. Tester la connexion avec `/wp-json/wp/v2/users/me`
5. Si succès :
   - Créer ou mettre à jour la config dans `wordpress_configs`
   - Mettre `is_verified: true`
6. Retourner le résultat

**Réponse succès** :
```json
{
  "success": true,
  "message": "Connexion WordPress réussie"
}
```

**Réponse erreur** :
```json
{
  "success": false,
  "error": "Impossible de se connecter à WordPress"
}
```

**Secrets utilisés** :
- Aucun

---

### 9. `test-openai` (verify_jwt = false)

**Description** : Fonction de test pour vérifier la connexion OpenAI.

**Méthode** : GET ou POST

**Authentification** : Non requise (pour les tests)

**Paramètres** : Aucun

**Logique** :
1. Appeler OpenAI API avec un prompt simple
2. Vérifier que la réponse est reçue
3. Retourner le statut

**Réponse succès** :
```json
{
  "success": true,
  "message": "OpenAI API fonctionne correctement"
}
```

**Réponse erreur** :
```json
{
  "success": false,
  "error": "Erreur OpenAI API"
}
```

**Secrets utilisés** :
- `OPENAI_API_KEY`

---

## 📦 Secrets Requis dans Supabase

Tous ces secrets doivent être configurés dans **Settings > Edge Functions > Secrets** :

```
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-proj-...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_PRO_YEARLY=price_...
VITE_STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
VITE_STRIPE_PRICE_UNLIMITED_YEARLY=price_...
```

**Note** : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions.

---

## 🔄 Mapping Price ID → Plan

Dans les fonctions `sync-subscription` et `stripe-webhook`, utilisez ce mapping :

```typescript
const PRICE_TO_PLAN = {
  [Deno.env.get('VITE_STRIPE_PRICE_PRO_MONTHLY')!]: {
    plan_type: 'pro',
    articles_limit: 10
  },
  [Deno.env.get('VITE_STRIPE_PRICE_PRO_YEARLY')!]: {
    plan_type: 'pro',
    articles_limit: 10
  },
  [Deno.env.get('VITE_STRIPE_PRICE_UNLIMITED_MONTHLY')!]: {
    plan_type: 'unlimited',
    articles_limit: 999999
  },
  [Deno.env.get('VITE_STRIPE_PRICE_UNLIMITED_YEARLY')!]: {
    plan_type: 'unlimited',
    articles_limit: 999999
  }
};
```

---

## 📝 Notes Importantes

1. **Pas de plan gratuit** : Les utilisateurs doivent soit :
   - Acheter un test à 5€ (1 article)
   - Souscrire à un plan payant (Pro ou Illimité)

2. **Gestion des quotas** :
   - Les achats one-time sont prioritaires sur les quotas d'abonnement
   - Les quotas se réinitialisent automatiquement chaque mois
   - Le plan "unlimited" a une limite technique de 999999 articles

3. **Sécurité** :
   - Toutes les fonctions sensibles utilisent `verify_jwt = true`
   - Le webhook Stripe vérifie la signature
   - Utilisez `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les Edge Functions, jamais côté client

4. **Stripe API Version** :
   - Utilisez la version `2025-08-27.basil` ou la plus récente

---

## ✅ Checklist de Création

- [ ] `generate` - Génération d'articles
- [ ] `create-checkout` - Création session abonnement
- [ ] `create-one-time-purchase` - Création session test 5€
- [ ] `handle-payment-success` - Gestion succès paiement one-time
- [ ] `sync-subscription` - Synchronisation abonnement
- [ ] `stripe-webhook` - Webhook Stripe
- [ ] `wordpress-publish` - Publication WordPress
- [ ] `wordpress-test` - Test connexion WordPress
- [ ] `test-openai` - Test OpenAI

Tous les secrets configurés dans Supabase Dashboard.



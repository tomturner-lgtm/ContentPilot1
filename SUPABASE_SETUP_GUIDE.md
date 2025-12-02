# Guide de Configuration Supabase - ContentPilot

## 📋 Étapes de Configuration

### 1. Exécuter le Script SQL

1. Allez dans votre projet Supabase Dashboard
2. Cliquez sur **SQL Editor** dans le menu de gauche
3. Créez une nouvelle requête
4. Copiez-collez le contenu de `supabase_setup.sql`
5. Cliquez sur **Run** pour exécuter le script

✅ Vérifiez que toutes les tables sont créées : `user_quotas`, `one_time_purchases`, `articles`, `wordpress_configs`

---

### 2. Configuration de l'Authentification

1. Allez dans **Authentication** > **Providers**
2. Activez **Email** provider
3. Allez dans **Authentication** > **Settings**
4. Activez **"Enable email confirmations"** : **DÉSACTIVÉ** (pour auto-confirm)
   - Ou configurez un template d'email personnalisé
5. **Disable signup** : **DÉSACTIVÉ** (pour permettre les inscriptions)

---

### 3. Configuration des Secrets (Edge Functions)

Allez dans **Settings** > **Edge Functions** > **Secrets** et ajoutez :

#### Secrets Requis :

```
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-proj-...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_...
VITE_STRIPE_PRICE_PRO_YEARLY=price_...
VITE_STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
VITE_STRIPE_PRICE_UNLIMITED_YEARLY=price_...
```

**Note** : Les secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions.

---

### 4. Création des Edge Functions

#### Structure des Edge Functions

Créez les Edge Functions suivantes dans **Edge Functions** :

#### `generate` (verify_jwt = true)

```typescript
// Fonction pour générer un article avec OpenAI
// Vérifie le quota avant génération
// Sauvegarde l'article dans la table articles
// Met à jour le quota ou utilise un achat one-time
```

**Paramètres attendus** :
- `title` (string, requis)
- `keyword` (string, requis)
- `length` (number, optionnel, défaut: 1000)
- `template` (string, optionnel)
- `language` (string, optionnel, défaut: 'fr')

**Retourne** :
- `{ article: string }` (markdown) en cas de succès
- `{ error: string }` en cas d'erreur

---

#### `create-checkout` (verify_jwt = true)

```typescript
// Crée une session Stripe Checkout pour un abonnement
```

**Paramètres attendus** :
- `priceId` (string, requis)
- `planType` (string, requis: 'pro' | 'unlimited')

**Retourne** :
- `{ url: string, sessionId: string }`

---

#### `create-one-time-purchase` (verify_jwt = true)

```typescript
// Crée une session Stripe Checkout pour un achat unique (5€)
```

**Paramètres attendus** : Aucun

**Retourne** :
- `{ url: string, sessionId: string }`

---

#### `handle-payment-success` (verify_jwt = false)

```typescript
// Gère le succès d'un paiement one-time
// Appelé depuis le frontend après redirection Stripe
```

**Paramètres attendus** :
- `sessionId` (string, requis)

**Retourne** :
- `{ success: boolean, message?: string }`

---

#### `sync-subscription` (verify_jwt = true)

```typescript
// Synchronise l'abonnement Stripe avec la base de données
// Met à jour user_quotas avec les données Stripe
```

**Paramètres attendus** : Aucun (utilise l'utilisateur authentifié)

**Retourne** :
- `{ plan_type: string, articles_limit: number, ... }`

---

#### `stripe-webhook` (verify_jwt = false)

```typescript
// Webhook Stripe pour gérer les événements d'abonnement
// Gère checkout.session.completed, customer.subscription.updated, etc.
```

**Headers requis** :
- `stripe-signature` (vérification de la signature)

**Retourne** :
- `{ received: true }`

---

#### `wordpress-publish` (verify_jwt = true)

```typescript
// Publie un article sur WordPress
```

**Paramètres attendus** :
- `articleId` (string, requis)
- `title` (string, optionnel - override)
- `content` (string, optionnel - override)

**Retourne** :
- `{ success: boolean, postId?: number, url?: string, error?: string }`

---

#### `wordpress-test` (verify_jwt = true)

```typescript
// Teste la connexion WordPress
```

**Paramètres attendus** :
- `siteUrl` (string, requis)
- `username` (string, requis)
- `applicationPassword` (string, requis)

**Retourne** :
- `{ success: boolean, message?: string }`

---

#### `test-openai` (verify_jwt = false)

```typescript
// Fonction de test pour vérifier la connexion OpenAI
```

**Paramètres attendus** : Aucun

**Retourne** :
- `{ success: boolean, message?: string }`

---

### 5. Configuration Stripe

#### Créer les Produits et Prix dans Stripe

1. Allez sur https://dashboard.stripe.com/products
2. Créez les produits suivants :

**Plan Pro Mensuel**
- Nom : "ContentPilot Pro - Mensuel"
- Prix : 50€/mois (subscription)
- Copiez le `price_id` → `VITE_STRIPE_PRICE_PRO_MONTHLY`

**Plan Pro Annuel**
- Nom : "ContentPilot Pro - Annuel"
- Prix : 550€/an (subscription, 11 mois payés)
- Copiez le `price_id` → `VITE_STRIPE_PRICE_PRO_YEARLY`

**Plan Illimité Mensuel**
- Nom : "ContentPilot Illimité - Mensuel"
- Prix : 100€/mois (subscription)
- Copiez le `price_id` → `VITE_STRIPE_PRICE_UNLIMITED_MONTHLY`

**Plan Illimité Annuel**
- Nom : "ContentPilot Illimité - Annuel"
- Prix : 1100€/an (subscription, 11 mois payés)
- Copiez le `price_id` → `VITE_STRIPE_PRICE_UNLIMITED_YEARLY`

**Achat One-Time (Test)**
- Nom : "ContentPilot - Test (1 article)"
- Prix : 5€ (one-time payment)
- Pas besoin de price_id (géré dans le code)

#### Configurer le Webhook Stripe

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur **Add endpoint**
3. URL : `https://[votre-projet].supabase.co/functions/v1/stripe-webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded` (pour one-time)
5. Copiez le **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

### 6. Variables d'Environnement pour le Frontend (Lovable)

Dans Lovable, configurez ces variables d'environnement :

```
NEXT_PUBLIC_SUPABASE_URL=https://[votre-projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-anon-key]
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_... (ou pk_live_...)
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY=price_...
NEXT_PUBLIC_BASE_URL=https://[votre-domaine]
```

**Où trouver ces valeurs** :
- `SUPABASE_URL` et `SUPABASE_ANON_KEY` : Supabase Dashboard > Settings > API
- `STRIPE_PUBLIC_KEY` : Stripe Dashboard > Developers > API keys
- `STRIPE_PRICE_*` : Créés dans Stripe (voir section 5)

---

### 7. Mapping des Plans

#### Plan Types dans la Base de Données

- `free` : Plan gratuit (1 article/mois)
- `pro` : Plan Pro (10 articles/mois)
- `unlimited` : Plan Illimité (articles illimités)

#### Mapping Price ID → Plan Type

Dans les Edge Functions `stripe-webhook` et `sync-subscription`, mappez les `price_id` :

```typescript
const PRICE_TO_PLAN = {
  [process.env.VITE_STRIPE_PRICE_PRO_MONTHLY]: {
    plan_type: 'pro',
    articles_limit: 10
  },
  [process.env.VITE_STRIPE_PRICE_PRO_YEARLY]: {
    plan_type: 'pro',
    articles_limit: 10
  },
  [process.env.VITE_STRIPE_PRICE_UNLIMITED_MONTHLY]: {
    plan_type: 'unlimited',
    articles_limit: 999999 // ou null pour illimité
  },
  [process.env.VITE_STRIPE_PRICE_UNLIMITED_YEARLY]: {
    plan_type: 'unlimited',
    articles_limit: 999999
  }
};
```

---

### 8. Test de la Configuration

#### Tester la Base de Données

```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Vérifier les policies RLS
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';

-- Tester la fonction get_user_quota (remplacez USER_ID)
SELECT get_user_quota('USER_ID_HERE');
```

#### Tester les Edge Functions

1. Testez `test-openai` pour vérifier la connexion OpenAI
2. Testez `wordpress-test` avec vos credentials WordPress
3. Créez un utilisateur de test et vérifiez qu'un quota est créé automatiquement

---

### 9. Notes Importantes

⚠️ **Sécurité** :
- Ne commitez jamais les secrets dans le code
- Utilisez les secrets Supabase pour les Edge Functions
- Les variables `NEXT_PUBLIC_*` sont exposées au client
- Utilisez `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les Edge Functions (jamais côté client)

⚠️ **RLS (Row Level Security)** :
- Toutes les tables ont RLS activé
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Les Edge Functions utilisent `SUPABASE_SERVICE_ROLE_KEY` pour bypasser RLS si nécessaire

⚠️ **Quotas** :
- Les quotas se réinitialisent automatiquement chaque mois
- Les achats one-time sont prioritaires sur les quotas
- Le plan "unlimited" a une limite technique de 999999 articles

---

### 10. Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs des Edge Functions dans Supabase Dashboard
2. Vérifiez les logs Stripe dans Stripe Dashboard > Developers > Logs
3. Testez les fonctions SQL directement dans l'éditeur SQL
4. Vérifiez que tous les secrets sont correctement configurés

---

**✅ Configuration terminée !**

Une fois toutes ces étapes complétées, votre backend Supabase sera prêt à être utilisé avec le frontend Lovable.



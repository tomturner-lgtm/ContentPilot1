# Variables d'Environnement - ContentPilot

## 📋 Configuration Complète

Copiez ces variables dans votre fichier `.env.local` à la racine du projet.

**⚠️ IMPORTANT** : Le plan gratuit a été supprimé. Il est remplacé par un plan test à 5€ (1 article).

```bash
# Supabase Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe Price IDs
STRIPE_PRICE_TEST="price_your_test_price_id_here"
STRIPE_PRICE_PRO_MONTHLY="price_your_pro_monthly_price_id_here"
STRIPE_PRICE_PRO_YEARLY="price_your_pro_yearly_price_id_here"
STRIPE_PRICE_UNLIMITED_MONTHLY="price_your_unlimited_monthly_price_id_here"
STRIPE_PRICE_UNLIMITED_YEARLY="price_your_unlimited_yearly_price_id_here"

# OpenAI Configuration
OPENAI_API_KEY="sk-proj-your-openai-api-key-here"

# Application URLs
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"

# Public Stripe Key (for frontend)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_your_stripe_publishable_key_here"

# Public Supabase Keys (for frontend)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# Public Stripe Price IDs (for frontend)
NEXT_PUBLIC_STRIPE_PRICE_TEST="price_your_test_price_id_here"
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY="price_your_pro_monthly_price_id_here"
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY="price_your_pro_yearly_price_id_here"
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY="price_your_unlimited_monthly_price_id_here"
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY="price_your_unlimited_yearly_price_id_here"
```

## 📝 Notes Importantes

1. **Plan Gratuit Supprimé** : Le plan gratuit a été remplacé par un plan test à 5€ (1 article). Les utilisateurs doivent soit :
   - Acheter le test à 5€ (`STRIPE_PRICE_TEST`)
   - Souscrire à un plan Pro ou Illimité (mensuel ou annuel)

2. **Variables Publiques** : Les variables commençant par `NEXT_PUBLIC_` sont exposées au client (frontend). Ne mettez jamais de secrets dans ces variables.

3. **Variables Privées** : Les variables sans `NEXT_PUBLIC_` sont uniquement accessibles côté serveur (API routes).

4. **Railway Deployment** : Pour déployer sur Railway, ajoutez toutes ces variables dans Railway Dashboard > Variables.

## 🔑 Où Trouver les Vraies Valeurs

**⚠️ IMPORTANT** : Ce fichier contient des placeholders. Les vraies valeurs doivent être stockées dans :
- `.env.local` (pour le développement local)
- Railway Dashboard > Variables (pour la production)
- **JAMAIS** dans le repository Git

### Supabase
- `SUPABASE_URL` et `SUPABASE_ANON_KEY` : Supabase Dashboard > Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` : Supabase Dashboard > Settings > API (Service Role Key)

### Stripe
- `STRIPE_SECRET_KEY` et `STRIPE_PUBLISHABLE_KEY` : Stripe Dashboard > Developers > API keys
- `STRIPE_WEBHOOK_SECRET` : Stripe Dashboard > Developers > Webhooks > Signing secret
- `STRIPE_PRICE_*` : Stripe Dashboard > Products > [Product] > Pricing (copier le Price ID)

### OpenAI
- `OPENAI_API_KEY` : https://platform.openai.com/api-keys

## 🔧 Configuration Stripe Webhook

Dans Stripe Dashboard, configurez le webhook avec :
- **URL** : `https://your-domain.com/api/stripe/webhook`
- **Événements** :
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`

## ✅ Vérification

Après avoir configuré les variables, vérifiez que :
- [ ] Toutes les variables sont définies
- [ ] Les URLs Supabase sont correctes
- [ ] Les Price IDs Stripe correspondent à vos produits
- [ ] Le webhook Stripe est configuré avec la bonne URL


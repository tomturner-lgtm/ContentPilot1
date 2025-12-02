# Nouveau Prompt Lovable – Frontend connecté à Supabase

## 1. Contexte & Objectif
- Backend entièrement migré sur Supabase (Postgres + Edge Functions)
- Plus aucun plan gratuit : seule option de test = achat one-shot à 5 € (donne 1 article)
- Plans payants = Pro (10 articles/mois) et Illimité (articles illimités). Chaque plan existe en mensuel et annuel
- Frontend (Next.js 14 App Router) doit appeler les Edge Functions Supabase (pas d'API Next locale)
- Auth = Supabase Auth (email/password). Le front utilise le client Supabase côté navigateur

## 2. Variables d'environnement côté Lovable
```
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY=price_...
NEXT_PUBLIC_BASE_URL=https://<domain>
```

## 3. Edge Functions disponibles (toutes sous https://<PROJECT>.supabase.co/functions/v1)
| Fonction | Route | Méthode | Auth | Payload | Usage Front |
| --- | --- | --- | --- | --- | --- |
| `generate` | `/generate` | POST | JWT | `{ title, keyword, length?, template?, language? }` | Formulaire /generate : appelle la fonction, affiche l'article, sauvegarde l'ID retourné |
| `create-checkout` | `/create-checkout` | POST | JWT | `{ priceId, planType: 'pro'|'unlimited', billingPeriod: 'monthly'|'yearly' }` | CTA Pro/Illimité -> Stripe subscription |
| `create-one-time-purchase` | `/create-one-time-purchase` | POST | JWT | `{}` | CTA "Tester pour 5 €" (donne 1 article) |
| `handle-payment-success` | `/handle-payment-success` | POST | none | `{ sessionId }` | Page /success : valide un paiement one-shot via session_id |
| `sync-subscription` | `/sync-subscription` | POST | JWT | `{}` | Bouton "Mettre à jour mon abonnement" ou auto après Stripe |
| `stripe-webhook` | `/stripe-webhook` | POST | none | Stripe events | (backend only) pas besoin côté front |
| `wordpress-test` | `/wordpress-test` | POST | JWT | `{ siteUrl, username, applicationPassword }` | Page /integrations : bouton "Tester connexion" |
| `wordpress-publish` | `/wordpress-publish` | POST | JWT | `{ articleId, title?, content? }` | Depuis page article détaillée, publie sur WP |
| `test-openai` | `/test-openai` | GET | none | - | Page debug |

> Tous les appels authentifiés nécessitent le Supabase client pour obtenir le JWT (`const { data: { session } } = await supabase.auth.getSession()`). Ajouter le header `Authorization: Bearer <session.access_token>` dans `fetch`.

## 4. Flot de paiement et quotas
- Supprimer toute mention "plan gratuit". Accueil + Pricing mettent en avant : Test 5 €, Pro, Pro Annuel (1 mois offert), Illimité, Illimité Annuel (1 mois offert)
- CTA "Tester pour 5 €" -> `create-one-time-purchase`
- CTA Pro/Illimité -> `create-checkout` avec le `priceId` correspondant (utiliser les env `NEXT_PUBLIC_STRIPE_PRICE_*`)
- Page `/success` :
  1. Lire `session_id` dans l'URL
  2. Appeler `handle-payment-success` (pour les paiements one-shot)
  3. Afficher confirmation + bouton "Retour au générateur"
- Badge quota dans le header = données Supabase :
  - Utiliser une requête RPC `get_user_quota` via Supabase ou relire la réponse de `generate`
  - Afficher plan actif + `articles_used / articles_limit`
  - Si plan illimité, afficher "Illimité" avec animation

## 5. Pages à ajuster
1. **Layout / Header**
   - Ajouter Supabase auth state (afficher avatar ou bouton "Se connecter")
   - Badge quota connecté à Supabase (plus de localStorage)
2. **/generate**
   - Formulaire identique mais :
     - Vérifier que l'utilisateur est connecté sinon ouvrir modal auth
     - `fetch` → `POST https://<PROJECT>.supabase.co/functions/v1/generate`
     - Stocker l'`articleId` retourné pour rediriger vers `/articles/[id]`
3. **/pricing**
   - 5 cartes : Test 5 €, Pro mensuel, Pro annuel, Illimité mensuel, Illimité annuel
   - Chaque CTA déclenche la fonction correspondante (voir tableau). Indiquer économies annuelles
4. **/success**
   - Gestion Stripe (voir §4)
5. **/articles` & `/articles/[id]`**
   - Récupérer les articles depuis Supabase (`articles` table filtrée par `user_id`)
   - Supprimer toute dépendance à localStorage
6. **/integrations**
   - Formulaire WordPress -> `wordpress-test`
   - Bouton "Publier sur WordPress" (page article) -> `wordpress-publish`
7. **Auth modals**
   - Créer un composant login/register (email/password) basé sur Supabase Auth

## 6. États UI & feedback
- Loading states pour tous les boutons (CTA, génération, WP test)
- Toast success/error suivant la réponse des Edge Functions
- Afficher messages spécifiques :
  - Quota épuisé → proposer CTA vers Pricing + Test 5 €
  - Achat one-shot validé → message "1 article disponible"
  - Abonnement actif → message "Plan Pro actif"

## 7. Checklist Lovable
- [ ] Ajouter client Supabase + hooks d'auth dans le layout
- [ ] Mettre à jour tous les fetch → Edge Functions Supabase
- [ ] Implémenter Pricing (5 cartes) + CTA connectés
- [ ] Gestion du test à 5 € + page success
- [ ] Historique d'articles depuis Supabase (plus de localStorage)
- [ ] Intégration WordPress via `wordpress-test` / `wordpress-publish`
- [ ] Badge quota + toasts cohérents
- [ ] QA complètes :
  - Création de compte, login, test 5 €, génération article
  - Abonnement Pro / Illimité (monthly + yearly)
  - Synchronisation `sync-subscription`
  - Publication WordPress

> Ce prompt complète le précédent (animations, design). Ici l'objectif est de brancher le front Lovable sur Supabase + Stripe en supprimant définitivement le plan gratuit.

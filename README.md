# ContentFlow

Application web moderne de génération d'articles de blog avec IA.

## Fonctionnalités

- 🚀 Page d'accueil avec présentation et fonctionnalités
- ✍️ Générateur d'articles avec formulaire personnalisable
- 🤖 Intégration OpenAI (gpt-4o-mini)
- 🎨 Design moderne avec Tailwind CSS
- 📱 Responsive mobile-first

## Installation

1. Installer les dépendances :

```bash
npm install
```

2. Configurer les variables d'environnement :

Créez un fichier `.env.local` à la racine du projet :

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Stripe (pour le Plan Pro)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PRICE_ID=price_your_stripe_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Base URL (pour les redirects Stripe)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Note importante pour Stripe :**
- Créez un compte Stripe et récupérez vos clés API
- Créez un produit avec un prix (subscription) dans Stripe Dashboard
- Utilisez l'ID du prix (price_xxx) pour `NEXT_PUBLIC_STRIPE_PRICE_ID`
- Configurez le webhook Stripe avec l'URL : `https://votre-domaine.com/api/webhook`

3. Lancer le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Fonctionnalités de quota et plans

L'application inclut un système de quota et de plans avec les fonctionnalités suivantes :

### Plans disponibles

- **Plan Gratuit** : 1 article par mois (0€)
- **Plan Pro** : 10 articles par mois (50€/mois ou 550€/an avec 1 mois offert)
- **Plan Max** : Articles illimités (100€/mois ou 1100€/an avec 1 mois offert)
  - *Note : Le plan Max a une limite cachée de 200 articles/mois dans le code*

### Fonctionnalités

- **Stockage local** : Les quotas et plans sont stockés dans le `localStorage` du navigateur
- **Reset automatique** : Le quota se réinitialise automatiquement chaque mois
- **Affichage en temps réel** : Badge dans le header avec barre de progression et plan actuel
- **Alertes** : Notification automatique quand il ne reste qu'1 article (plan gratuit uniquement)
- **Blocage intelligent** : Message et redirection vers la page de paiement quand la limite est atteinte
- **Paiement mensuel ou annuel** : Tous les plans payants peuvent être souscrits mensuellement ou annuellement avec une remise de 1 mois offert sur l'abonnement annuel

## Historique des articles

L'application inclut un système d'historique complet :

- **Sauvegarde automatique** : Tous les articles générés sont automatiquement sauvegardés dans `localStorage`
- **Maximum 50 articles** : Les articles les plus récents sont conservés (les plus anciens sont supprimés automatiquement)
- **Page "Mes Articles"** (`/articles`) : Liste tous les articles avec aperçu, date et mot-clé
- **Page de détail** : Affichage complet avec formatage markdown
- **Fonctions d'export** :
  - Copier le texte brut
  - Télécharger en format Markdown (.md)
  - Télécharger en format HTML (.html)
  - Copier le HTML dans le presse-papiers

## Structure du projet

```
ContentPilot/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # API route pour OpenAI
│   ├── generate/
│   │   └── page.tsx          # Page générateur avec système de quota
│   ├── articles/
│   │   ├── page.tsx          # Liste des articles générés
│   │   └── [id]/
│   │       └── page.tsx      # Page de détail article avec export
│   ├── pricing/
│   │   └── page.tsx          # Page de tarifs
│   ├── globals.css           # Styles globaux Tailwind
│   ├── layout.tsx            # Layout principal avec Header
│   └── page.tsx              # Page d'accueil
├── components/
│   └── Header.tsx            # Header avec badge de quota
├── hooks/
│   ├── usePlan.ts            # Hook pour gérer les plans utilisateur
│   ├── useQuota.ts           # Hook pour gérer les quotas (localStorage)
│   └── useArticles.ts        # Hook pour gérer l'historique des articles
├── package.json
├── tailwind.config.ts        # Configuration Tailwind
└── tsconfig.json
```

## Technologies utilisées

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first
- **OpenAI API** - Génération d'articles avec gpt-4o-mini
- **React Markdown** - Affichage du contenu en Markdown
- **Marked** - Conversion Markdown vers HTML pour l'export
- **Stripe** - Paiements pour le Plan Pro

## Production

Pour créer une build de production :

```bash
npm run build
npm start
```

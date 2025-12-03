# Fix Erreur Build Vercel - Guide Rapide

## 🔍 Diagnostic Rapide

L'erreur `Command "npm run build" exited with 1` peut avoir plusieurs causes. Voici comment les identifier et les corriger.

---

## ✅ Solution 1 : Vérifier les Variables d'Environnement

**Cause la plus fréquente** : Variables d'environnement manquantes.

### Variables OBLIGATOIRES dans Vercel Dashboard :

1. Allez dans **Vercel Dashboard** > Votre projet > **Settings** > **Environment Variables**

2. Ajoutez ces variables pour **Production**, **Preview**, et **Development** :

#### Variables Publiques (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLIC_KEY
NEXT_PUBLIC_STRIPE_PRICE_TEST
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY
NEXT_PUBLIC_APP_URL
```

#### Variables Privées (Serveur uniquement)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_TEST
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY
STRIPE_PRICE_UNLIMITED_MONTHLY
STRIPE_PRICE_UNLIMITED_YEARLY
OPENAI_API_KEY
```

3. **Important** : Après avoir ajouté les variables, **redéployez** le projet.

---

## ✅ Solution 2 : Vérifier les Erreurs TypeScript

### Vérifier localement :

```bash
# Installer les dépendances
npm install

# Vérifier les types TypeScript
npx tsc --noEmit

# Lancer le build localement
npm run build
```

### Erreurs courantes :

1. **Imports manquants** : Vérifiez que tous les imports sont corrects
2. **Types incorrects** : Vérifiez les types dans les fichiers `.ts` et `.tsx`
3. **Fichiers manquants** : Vérifiez que tous les fichiers référencés existent

---

## ✅ Solution 3 : Vérifier la Configuration Next.js

### Vérifier `next.config.js` :

Le fichier doit être valide. Si vous avez des erreurs, utilisez cette configuration minimale :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ajoutez d'autres options si nécessaire
}

module.exports = nextConfig
```

---

## ✅ Solution 4 : Vérifier les Dépendances

### Vérifier `package.json` :

Assurez-vous que toutes les dépendances sont présentes :

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.4",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "stripe": "^14.21.0",
    "@stripe/stripe-js": "^2.4.0",
    "openai": "^4.20.1",
    "react-markdown": "^9.0.1",
    "marked": "^11.1.1"
  }
}
```

---

## ✅ Solution 5 : Vérifier les Logs Vercel

1. Allez dans **Vercel Dashboard** > Votre projet > **Deployments**
2. Cliquez sur le dernier déploiement (celui qui a échoué)
3. Regardez les **Build Logs**
4. Identifiez l'erreur exacte (généralement à la fin des logs)

### Erreurs courantes dans les logs :

- `Module not found: Can't resolve '@/...'` → Problème de path alias
- `Environment variable not found` → Variable manquante
- `Type error` → Erreur TypeScript
- `Syntax error` → Erreur de syntaxe JavaScript/TypeScript

---

## 🔧 Corrections Spécifiques

### Problème : Path Alias `@/*`

Si vous avez des erreurs avec les imports `@/...`, vérifiez `tsconfig.json` :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Problème : `createRouteHandlerClient` non trouvé

Assurez-vous que `@supabase/auth-helpers-nextjs` est installé :

```bash
npm install @supabase/auth-helpers-nextjs
```

### Problème : Variables d'environnement non définies

Dans les fichiers API routes, utilisez des valeurs par défaut :

```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})
```

---

## 📋 Checklist Avant Déploiement

- [ ] Toutes les variables d'environnement sont dans Vercel Dashboard
- [ ] Le build fonctionne localement (`npm run build`)
- [ ] Aucune erreur TypeScript (`npx tsc --noEmit`)
- [ ] Tous les imports sont corrects
- [ ] `package.json` contient toutes les dépendances
- [ ] `.env.local` est dans `.gitignore` (ne pas commiter)
- [ ] `next.config.js` est valide

---

## 🚀 Commandes de Test

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier les types
npx tsc --noEmit

# 3. Linter
npm run lint

# 4. Build local
npm run build

# 5. Si le build local fonctionne, push vers Vercel
git add .
git commit -m "Fix build errors"
git push
```

---

## 🆘 Si Rien ne Fonctionne

1. **Vérifier les logs Vercel** : L'erreur exacte est dans les Build Logs
2. **Build local** : Reproduire l'erreur localement pour mieux la comprendre
3. **Version Node** : Vérifier que Vercel utilise Node 18.x ou 20.x
4. **Nettoyer le cache** : Dans Vercel Dashboard > Settings > Clear Build Cache

---

## 📝 Configuration Vercel Recommandée

Dans Vercel Dashboard > Settings > General :

- **Framework Preset** : Next.js
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)
- **Node.js Version** : 18.x ou 20.x

---

**Note** : Après avoir corrigé les erreurs, faites un nouveau commit et push. Vercel redéploiera automatiquement.



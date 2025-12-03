# Guide de Déploiement Vercel - ContentPilot

## 🔧 Configuration Vercel

### 1. Variables d'Environnement à Configurer

Dans Vercel Dashboard > Settings > Environment Variables, ajoutez :

#### Variables Publiques (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_SUPABASE_URL=https://ybfbfmbnlsvgyhtzctpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRICE_TEST=price_1SVW9TCQc7L9vhgD6NrtRBK4
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1SVGLwCQc7L9vhgDOp2cw4wn
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_1SVUXJCQc7L9vhgDVShAMmE4
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_MONTHLY=price_1SVGMbCQc7L9vhgDuc2zUVyS
NEXT_PUBLIC_STRIPE_PRICE_UNLIMITED_YEARLY=price_1SVUXXCQc7L9vhgDEkMjivDk
NEXT_PUBLIC_APP_URL=https://votre-projet.vercel.app
```

#### Variables Privées (Serveur uniquement)
```
SUPABASE_URL=https://ybfbfmbnlsvgyhtzctpl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TEST=price_1SVW9TCQc7L9vhgD6NrtRBK4
STRIPE_PRICE_PRO_MONTHLY=price_1SVGLwCQc7L9vhgDOp2cw4wn
STRIPE_PRICE_PRO_YEARLY=price_1SVUXJCQc7L9vhgDVShAMmE4
STRIPE_PRICE_UNLIMITED_MONTHLY=price_1SVGMbCQc7L9vhgDuc2zUVyS
STRIPE_PRICE_UNLIMITED_YEARLY=price_1SVUXXCQc7L9vhgDEkMjivDk
OPENAI_API_KEY=sk-proj-...
```

**Important** : 
- Les variables `NEXT_PUBLIC_*` sont exposées au client
- Les autres sont uniquement côté serveur
- Configurez-les pour **Production**, **Preview**, et **Development**

---

## 🐛 Résolution des Erreurs de Build

### Erreur : "Command 'npm run build' exited with 1"

#### Solution 1 : Vérifier les Variables d'Environnement

Assurez-vous que toutes les variables sont configurées dans Vercel Dashboard.

#### Solution 2 : Vérifier les Erreurs TypeScript

Vercel affiche les erreurs TypeScript dans les logs. Vérifiez :
- Imports manquants
- Types incorrects
- Fichiers manquants

#### Solution 3 : Vérifier les Dépendances

Assurez-vous que `package.json` contient toutes les dépendances nécessaires.

#### Solution 4 : Build Local pour Tester

```bash
npm install
npm run build
```

Si le build échoue localement, corrigez les erreurs avant de push sur Vercel.

---

## 📋 Checklist de Déploiement

### Avant le Déploiement
- [ ] Toutes les variables d'environnement sont configurées dans Vercel
- [ ] Le build fonctionne localement (`npm run build`)
- [ ] Aucune erreur TypeScript (`npm run lint`)
- [ ] Les fichiers `.env.local` ne sont pas commités (dans `.gitignore`)

### Configuration Vercel
- [ ] Framework détecté : Next.js
- [ ] Build Command : `npm run build` (par défaut)
- [ ] Output Directory : `.next` (par défaut)
- [ ] Install Command : `npm install` (par défaut)
- [ ] Node.js Version : 18.x ou 20.x

### Après le Déploiement
- [ ] Vérifier que le site charge correctement
- [ ] Tester l'authentification Supabase
- [ ] Tester la génération d'article
- [ ] Tester les paiements Stripe (mode test)
- [ ] Vérifier les webhooks Stripe (URL à mettre à jour)

---

## 🔗 Configuration Stripe Webhook

Après déploiement sur Vercel, mettez à jour le webhook Stripe :

1. Allez sur Stripe Dashboard > Webhooks
2. Modifiez l'endpoint existant ou créez-en un nouveau
3. URL : `https://votre-projet.vercel.app/api/stripe/webhook`
4. Événements :
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copiez le nouveau Signing Secret et mettez à jour `STRIPE_WEBHOOK_SECRET` dans Vercel

---

## 🚨 Erreurs Courantes

### "Module not found"
- Vérifiez que toutes les dépendances sont dans `package.json`
- Exécutez `npm install` localement pour vérifier

### "Environment variable not found"
- Vérifiez que toutes les variables sont dans Vercel Dashboard
- Assurez-vous qu'elles sont configurées pour l'environnement correct (Production/Preview/Development)

### "Type error"
- Vérifiez les types TypeScript
- Assurez-vous que `tsconfig.json` est correctement configuré

### "Build timeout"
- Vercel a une limite de temps pour le build
- Optimisez le build en réduisant les dépendances inutiles

---

## 📝 Commandes Utiles

```bash
# Build local
npm run build

# Lint
npm run lint

# Vérifier les types
npx tsc --noEmit

# Vérifier les dépendances
npm audit
```

---

## 🔍 Debugging

Si le build échoue sur Vercel :

1. **Vérifier les logs** : Vercel Dashboard > Deployments > [Dernier déploiement] > Build Logs
2. **Reproduire localement** : `npm run build` pour voir les mêmes erreurs
3. **Vérifier les variables** : Assurez-vous qu'elles sont toutes définies
4. **Vérifier la version Node** : Vercel utilise Node 18.x par défaut

---

## ✅ Après Déploiement Réussi

1. Mettre à jour `NEXT_PUBLIC_APP_URL` avec l'URL Vercel
2. Mettre à jour le webhook Stripe avec la nouvelle URL
3. Tester toutes les fonctionnalités
4. Configurer un domaine personnalisé (optionnel)



# PROMPT COMPLET ANTIGRAVITY - Frontend ContentPilot

## 🎯 CONTEXTE DU PROJET

Je veux créer un site web moderne et animé pour **ContentPilot**, une application de génération d'articles de blog avec IA. Le backend est déjà créé avec Supabase (PostgreSQL + Edge Functions) et Stripe pour les paiements.

**Technologies requises** : HTML5, CSS3 (animations avancées), JavaScript (ES6+), aucune dépendance framework (vanilla JS).

---

## 🎨 IDENTITÉ VISUELLE

### Palette de Couleurs

**Couleur Primaire** : Violet (#8B5CF6)
- `#8B5CF6` - Primary (violet principal)
- `#7C3AED` - Primary Dark (hover, active)
- `#6D28D9` - Primary Darker
- `#F5F3FF` - Primary Light (backgrounds)

**Couleurs Secondaires** :
- Gris neutres : `#1F2937` (dark), `#374151` (medium), `#6B7280` (light), `#F9FAFB` (background)
- Accents : `#10B981` (succès), `#EF4444` (erreur), `#F59E0B` (warning)

**Fond du Site** :
- Fond principal : Dégradé violet/gris avec effet de profondeur
- Background : `linear-gradient(135deg, #F5F3FF 0%, #E0E7FF 50%, #F9FAFB 100%)`
- Effet parallax léger au scroll
- Particules animées en arrière-plan (optionnel)

### Typographie

- **Police principale** : Inter, system-ui, sans-serif
- **Titres** : Font-weight 700-800, tracking-tight
- **Corps** : Font-weight 400-500, line-height 1.6-1.8
- **Hiérarchie** : H1 (4rem-5rem), H2 (2.5rem-3rem), H3 (1.5rem-2rem)

---

## ✨ ANIMATIONS & EFFETS

### 1. Effet Halo de Souris (Custom Cursor)
- Cursor personnalisé avec halo violet flou qui suit la souris
- Changement de couleur sur les éléments interactifs (boutons, liens)
- Transition fluide avec `transform` et `filter: blur()`
- Taille : 40px-60px de diamètre

### 2. Animations d'Entrée
- **Fade-In-Up** : Apparition depuis le bas avec fade
- **Blur-In** : Apparition avec effet de flou
- **Scale-In** : Apparition avec zoom
- **Slide-In-Left/Right** : Glissement depuis les côtés
- **Stagger** : Délais progressifs pour les listes (0.1s entre chaque élément)

### 3. Animations au Hover
- **Boutons** : Scale (1.05), shadow augmentée, couleur plus foncée
- **Cards** : Lift (translateY -5px), shadow augmentée, rotation 3D subtile
- **Liens** : Soulignement animé, couleur primaire
- **Icônes** : Rotation légère ou scale

### 4. Animations au Scroll
- **Intersection Observer** : Déclencher animations quand éléments entrent dans viewport
- **Parallax** : Mouvement différentiel pour créer profondeur
- **CountUp** : Animation des chiffres (stats) au scroll

### 5. Effets Visuels
- **Glassmorphism** : Cartes avec backdrop-filter blur
- **Gradients animés** : Dégradés qui bougent subtilement
- **Shadows dynamiques** : Ombres qui réagissent au mouvement
- **Particules** : Particules flottantes en arrière-plan (optionnel)

---

## 📄 STRUCTURE DES PAGES

### 1. Page d'Accueil (`index.html`)

**Sections** :

#### Hero Section
- **Titre principal** : "ContentPilot" (grand, bold, animé)
- **Sous-titre** : "Générez des articles de blog en 1 clic avec l'IA"
- **CTA principal** : "Tester pour 5€" (bouton violet, animé)
- **CTA secondaire** : "Voir les plans" (lien)
- **Animation** : Cascade d'apparition (badge → titre → sous-titre → CTA)
- **Fond** : Parallax 3D subtil selon mouvement souris

#### Stats Section
- 3-4 statistiques avec icônes
- Exemples : "10,000+ articles générés", "500+ utilisateurs", "98% satisfaction"
- Animation : CountUp au scroll
- Design : Cards glassmorphism avec hover lift

#### Features Section
- 3-4 fonctionnalités principales
- Chaque feature : Icône, titre, description
- Animation : Stagger d'entrée, hover magnétique 3D
- Layout : Grid responsive (1 col mobile, 2-3 cols desktop)

#### Témoignages Section
- 2-3 témoignages clients
- Design : Cards avec avatar, nom, citation
- Animation : Scale-in + fade-in progressif
- Hover : Élévation + ombre

#### CTA Final Section
- Message d'appel à l'action
- Bouton "Commencer maintenant"
- Fond : Gradient dynamique réactif à la souris

### 2. Page Pricing (`pricing.html`)

**Éléments** :

- **Titre** : "Plans et Tarifs"
- **Toggle Mensuel/Annuel** : Switch animé avec badge "1 mois offert" sur annuel
- **5 Cards de Plans** :
  1. **Test** : 5€ (une fois) - 1 article
  2. **Pro Mensuel** : 50€/mois - 10 articles
  3. **Pro Annuel** : 550€/an - 10 articles (1 mois offert)
  4. **Illimité Mensuel** : 100€/mois - Illimité
  5. **Illimité Annuel** : 1100€/an - Illimité (1 mois offert)

**Design des Cards** :
- Border violet pour plan recommandé (Pro)
- Badge "Recommandé" sur Pro
- Liste de features avec checkmarks
- Bouton CTA avec loading state
- Animation : Magnetic card (rotation 3D au hover)
- Hover : Lift + shadow augmentée

**Fonctionnalités** :
- Toggle mensuel/annuel change les prix affichés
- Calcul automatique des économies annuelles
- Boutons déclenchent Stripe Checkout

### 3. Page Generate (`generate.html`)

**Éléments** :

- **Header** : "Générateur d'Articles" avec badge quota
- **Formulaire** :
  - Sélecteur de template (5 options avec icônes)
  - Sélecteur de langue (8 langues avec drapeaux)
  - Input titre (requis)
  - Input mot-clé (requis)
  - Slider longueur (500-2000 mots)
- **Bouton Générer** : Grand, violet, avec loading state
- **Progress Bar** : Animation pendant génération
- **Affichage Article** : Markdown rendu avec styles
- **Boutons Export** : Copier, Télécharger MD, Télécharger HTML

**Animations** :
- Formulaire : Fade-in-up
- Progress bar : Animation fluide
- Article : Apparition avec confettis si premier article
- Export buttons : Scale-in

**Vérifications** :
- Vérifier quota avant génération
- Rediriger vers pricing si quota épuisé
- Afficher erreurs avec toast notifications

### 4. Page Articles (`articles.html`)

**Éléments** :

- **Titre** : "Mes Articles"
- **Liste d'articles** : Grid responsive
- **Card Article** :
  - Titre (tronqué si long)
  - Mot-clé
  - Date de génération
  - Longueur
  - Bouton "Voir" → redirige vers détail
- **Animation** : Stagger d'entrée (0.1s entre chaque)
- **Empty State** : Message si aucun article

### 5. Page Article Detail (`article-detail.html`)

**Éléments** :

- **Titre de l'article**
- **Métadonnées** : Mot-clé, date, longueur, langue
- **Contenu** : Markdown rendu avec styles typographiques
- **Boutons Export** :
  - Copier texte
  - Télécharger .md
  - Télécharger .html
  - Copier HTML
- **Animation** : Fade-in du contenu

### 6. Page Success (`success.html`)

**Éléments** :

- **Icône succès** : Checkmark animé (scale + rotate)
- **Message** : "Paiement réussi !"
- **Description** : "Vous pouvez maintenant générer 1 article"
- **Bouton** : "Générer un article" → redirige vers generate
- **Animation** : Confettis, fade-in du message

### 7. Page Integrations (`integrations.html`)

**Éléments** :

- **Titre** : "Intégrations WordPress"
- **Formulaire** :
  - Input URL du site
  - Input Username
  - Input Application Password
- **Boutons** :
  - "Tester la connexion"
  - "Publier sur WordPress" (depuis page article)
- **Feedback** : Messages succès/erreur

---

## 🧩 COMPOSANTS RÉUTILISABLES

### Header (Navigation)
- **Logo** : "ContentPilot" (lien vers home)
- **Navigation** : Liens vers pages principales
- **Badge Quota** : Affiche plan + articles utilisés/limite
- **Bouton Auth** : "Se connecter" ou avatar utilisateur
- **Sticky** : Fixe en haut au scroll
- **Animation** : Fade-in au scroll down

### Auth Modal
- **Modal** : Overlay sombre + card centrée
- **Tabs** : Connexion / Inscription
- **Formulaire** : Email + Password
- **Boutons** : Submit + "Fermer"
- **Animation** : Scale-in + backdrop blur

### Toast Notifications
- **Position** : Top-right
- **Types** : Success (vert), Error (rouge), Info (bleu)
- **Animation** : Slide-in depuis droite, auto-dismiss après 3s
- **Design** : Glassmorphism avec icône

### Loading States
- **Spinner** : Animation rotation
- **Skeleton** : Placeholders animés (shimmer effect)
- **Progress Bar** : Barre de progression animée

---

## 🔌 INTÉGRATIONS BACKEND

### Supabase Client
```javascript
// Configuration Supabase
const SUPABASE_URL = 'https://ybfbfmbnlsvgyhtzctpl.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

// Initialiser client Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### Endpoints API à Appeler

1. **Authentification** :
   - `supabase.auth.signUp({ email, password })`
   - `supabase.auth.signInWithPassword({ email, password })`
   - `supabase.auth.signOut()`
   - `supabase.auth.getUser()`

2. **Quota** :
   - `GET /api/user/check-quota` → Retourne `{ canGenerate, plan, articlesUsed, articlesLimit }`

3. **Génération** :
   - `POST /api/generate` → Body: `{ title, keyword, length, template, language }`
   - Retourne : `{ article, articleId, quota }`

4. **Paiements** :
   - `POST /api/stripe/checkout` → Body: `{ priceId }`
   - Retourne : `{ url }` → Rediriger vers Stripe

5. **Articles** :
   - Récupérer depuis Supabase : `supabase.from('articles').select('*').eq('user_id', userId)`

6. **Success** :
   - `POST /api/stripe/handle-payment-success` → Body: `{ sessionId }`

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
- **Mobile** : < 640px (1 colonne, navigation hamburger)
- **Tablet** : 640px - 1024px (2 colonnes)
- **Desktop** : > 1024px (3-4 colonnes, navigation complète)

### Adaptations Mobile
- Menu hamburger au lieu de navigation complète
- Cards en colonne unique
- Animations simplifiées (moins de parallax)
- Touch-friendly (boutons plus grands)

---

## 🎬 ANIMATIONS DÉTAILLÉES

### CSS Keyframes à Créer

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blurIn {
  from {
    opacity: 0;
    filter: blur(10px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes magnetic {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(var(--mouse-x, 0), var(--mouse-y, 0)) rotate(2deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
```

### JavaScript pour Animations

- **Intersection Observer** : Détecter entrée dans viewport
- **Mouse tracking** : Pour effet halo et magnetic cards
- **Scroll parallax** : Calculer offset selon scroll
- **CountUp** : Animation progressive des chiffres

---

## 🎯 FONCTIONNALITÉS SPÉCIFIQUES

### Système de Quota
- Badge dans header avec :
  - Plan actuel (Test, Pro, Illimité)
  - Articles utilisés / Limite
  - Barre de progression visuelle
  - Couleur selon plan (violet pour Pro, gris pour Test)

### Gestion des Erreurs
- Toast notifications pour erreurs
- Messages clairs et actionnables
- Redirection automatique si quota épuisé

### États de Chargement
- Spinner pendant requêtes API
- Skeleton loaders pour contenu
- Progress bar pour génération d'article
- Désactiver boutons pendant chargement

---

## 🚀 PERFORMANCE

- **Lazy loading** : Images et sections
- **Debounce** : Pour recherches/filtres
- **Throttle** : Pour scroll events
- **Minification** : CSS et JS en production
- **Optimisation images** : Formats WebP, lazy load

---

## 📋 CHECKLIST DE CRÉATION

### Pages HTML
- [ ] `index.html` - Page d'accueil
- [ ] `pricing.html` - Tarifs
- [ ] `generate.html` - Générateur
- [ ] `articles.html` - Liste articles
- [ ] `article-detail.html` - Détail article
- [ ] `success.html` - Succès paiement
- [ ] `integrations.html` - Intégrations WordPress

### Fichiers CSS
- [ ] `styles.css` - Styles principaux
- [ ] `animations.css` - Toutes les animations
- [ ] `responsive.css` - Media queries

### Fichiers JavaScript
- [ ] `main.js` - Script principal
- [ ] `auth.js` - Gestion authentification
- [ ] `animations.js` - Gestion animations
- [ ] `api.js` - Appels API
- [ ] `utils.js` - Fonctions utilitaires

### Composants
- [ ] Header avec navigation
- [ ] Auth Modal
- [ ] Toast Notifications
- [ ] Loading Spinner
- [ ] Custom Cursor (halo)
- [ ] Progress Bar
- [ ] Cards (pricing, features, articles)

---

## 🎨 ÉLÉMENTS GRAPHIQUES À CRÉER

### Icônes SVG (à inclure inline)
- Checkmark (succès)
- X (erreur)
- Loading spinner
- Article icon
- Settings icon
- User icon
- Logout icon

### Illustrations (optionnel)
- Hero illustration (personnage avec ordinateur)
- Empty state illustration (aucun article)
- Success illustration (checkmark animé)

---

## 🔧 CONFIGURATION REQUISE

### Variables d'Environnement (à mettre dans un fichier config.js)
```javascript
const CONFIG = {
  SUPABASE_URL: 'https://ybfbfmbnlsvgyhtzctpl.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  API_BASE_URL: 'https://contentpilot1-production.up.railway.app',
  STRIPE_PRICE_TEST: 'price_1SVW9TCQc7L9vhgD6NrtRBK4',
  STRIPE_PRICE_PRO_MONTHLY: 'price_1SVGLwCQc7L9vhgDOp2cw4wn',
  STRIPE_PRICE_PRO_YEARLY: 'price_1SVUXJCQc7L9vhgDVShAMmE4',
  STRIPE_PRICE_UNLIMITED_MONTHLY: 'price_1SVGMbCQc7L9vhgDuc2zUVyS',
  STRIPE_PRICE_UNLIMITED_YEARLY: 'price_1SVUXXCQc7L9vhgDEkMjivDk',
}
```

---

## 💡 SUGGESTIONS D'AMÉLIORATION

### Éléments à Ajouter (Optionnels mais Recommandés)

1. **Page Dashboard** :
   - Vue d'ensemble des statistiques
   - Graphiques d'utilisation
   - Derniers articles générés
   - Quick actions

2. **Page Settings** :
   - Gestion du profil
   - Préférences de langue
   - Gestion de l'abonnement
   - Historique des paiements

3. **Page About** :
   - À propos de ContentPilot
   - Équipe
   - Contact
   - FAQ

4. **Composants Additionnels** :
   - Search bar (recherche d'articles)
   - Filtres (par date, mot-clé, template)
   - Pagination (pour liste d'articles)
   - Dark mode toggle (optionnel)

5. **Animations Avancées** :
   - Particules en arrière-plan (canvas)
   - Morphing shapes
   - Gradient orbs animés
   - Scroll-triggered animations complexes

---

## ✅ RÉSULTAT ATTENDU

Un site web moderne, élégant et animé avec :
- ✅ Design violet/gris avec dégradés
- ✅ Animations fluides et professionnelles
- ✅ Effet halo de souris interactif
- ✅ Cards magnétiques 3D
- ✅ Parallax subtil
- ✅ Responsive mobile-first
- ✅ Intégration complète Supabase + Stripe
- ✅ Performance optimisée
- ✅ Accessibilité (ARIA labels, keyboard navigation)

---

## 📝 NOTES IMPORTANTES

1. **Pas de Framework** : Utiliser uniquement HTML/CSS/JS vanilla
2. **Moderne** : Utiliser CSS Grid, Flexbox, CSS Variables
3. **Animations** : Préférer CSS animations + JavaScript pour contrôle
4. **Accessibilité** : Sémantique HTML, ARIA, focus states
5. **Performance** : Optimiser images, lazy load, code splitting si possible
6. **Cross-browser** : Tester sur Chrome, Firefox, Safari, Edge

---

**IMPORTANT** : Créer un site visuellement impressionnant avec des animations fluides, un design moderne, et une expérience utilisateur premium. Le site doit être fonctionnel et connecté au backend Supabase existant.


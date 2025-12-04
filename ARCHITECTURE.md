# Architecture ContentPilot

## Structure Simple

```
ContentPilot/
├── backend.js          ← Serveur Express (backend classique)
├── package.json        ← Dépendances pour Next.js (existant)
├── package-backend.json ← Dépendances pour Express (nouveau)
│
├── public/             ← Frontend statique
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── api.js          ← Appelle /backend/... au lieu de /api/...
│   └── package.json    ← (optionnel, pour référence)
│
└── workflows/          ← Tes workflows Cursor
    └── README.md
```

## Backend Express

Le fichier `backend.js` contient un serveur Express simple qui :

1. **Sert le frontend statique** depuis `public/`
2. **Expose des endpoints backend** sous `/backend/...`
3. **N'interfère pas** avec tes workflows Cursor

## Endpoints Backend

- `GET /backend/status` - Statut du serveur
- `GET /backend/user/check-quota` - Vérifier le quota
- `POST /backend/generate` - Générer un article

## Utilisation

### Pour Railway (production)

Railway utilisera `package-backend.json` (renomme-le en `package.json` si besoin) et lancera `backend.js`.

### Pour le développement local

```bash
# Option 1: Utiliser le backend Express
node backend.js

# Option 2: Utiliser Next.js (si tu veux garder les deux)
npm run dev
```

## Workflows Cursor

Tes workflows peuvent appeler les endpoints via `/backend/...` :

```javascript
// Exemple dans un workflow
const response = await fetch('/backend/status');
const data = await response.json();
```


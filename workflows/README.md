# Workflows Cursor

Ce dossier contient vos workflows Cursor personnalisés.

## Structure

Vos workflows peuvent appeler les endpoints backend via `/backend/...`

## Exemples d'endpoints disponibles

- `GET /backend/status` - Vérifier le statut du backend
- `GET /backend/user/check-quota` - Vérifier le quota utilisateur
- `POST /backend/generate` - Générer un article

## Utilisation dans vos workflows

```javascript
// Dans vos workflows Cursor
const response = await fetch('/backend/status');
const data = await response.json();
```


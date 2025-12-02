# Fix RLS Policies - Guide Rapide

## 🔧 Problème

Vous avez des warnings du linter Supabase concernant les politiques RLS :
- **auth_rls_initplan** : Les politiques utilisent `auth.uid()` directement, ce qui cause une réévaluation pour chaque ligne
- **multiple_permissive_policies** : Des politiques dupliquées existent sur certaines tables

## ✅ Solution

### Option 1 : Correction pour une base existante

Si vous avez déjà exécuté le script initial et que vous avez ces warnings :

1. Ouvrez **SQL Editor** dans Supabase Dashboard
2. Exécutez le fichier **`supabase_fix_rls.sql`**
3. Ce script va :
   - Supprimer toutes les politiques existantes (y compris les doublons)
   - Recréer les politiques avec `(select auth.uid())` pour optimiser les performances
   - Éliminer les politiques dupliquées

### Option 2 : Script principal mis à jour

Le fichier **`supabase_setup.sql`** a été mis à jour pour utiliser la syntaxe optimisée dès le départ.

Si vous créez une nouvelle base de données, utilisez simplement ce script et vous n'aurez pas ces warnings.

## 📋 Changements effectués

### Avant (non optimisé)
```sql
USING (auth.uid() = user_id)
```

### Après (optimisé)
```sql
USING ((select auth.uid()) = user_id)
```

## 🎯 Résultat

Après exécution du script de correction :
- ✅ Plus de warnings `auth_rls_initplan`
- ✅ Plus de warnings `multiple_permissive_policies`
- ✅ Meilleures performances des requêtes RLS
- ✅ Même niveau de sécurité

## 🔍 Vérification

Pour vérifier que les politiques sont correctement créées :

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Vous devriez voir une seule politique par action (SELECT, INSERT, UPDATE, DELETE) pour chaque table.

## 📚 Documentation

Pour plus d'informations sur l'optimisation RLS :
- https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select



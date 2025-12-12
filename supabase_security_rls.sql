-- ==============================================================================
-- CONTENTPILOT - CONFIGURATION ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Exécutez ce script dans Supabase SQL Editor pour sécuriser vos tables
-- ==============================================================================

-- ═══════════════════════════════════════════════════════════════
-- CHECK : Vérifier l'état actuel de RLS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'articles', 'one_time_purchases');

-- ═══════════════════════════════════════════════════════════════
-- TABLE USERS : Activer RLS
-- ═══════════════════════════════════════════════════════════════

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role has full access to users" ON public.users;

-- Politique : Users peuvent voir leurs propres données
CREATE POLICY "Users can view own data"
ON public.users FOR SELECT
USING (auth.uid() = auth_id);

-- Politique : Users peuvent modifier leurs propres données
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
USING (auth.uid() = auth_id);

-- Politique : Service role a accès total (pour les webhooks Stripe, etc.)
CREATE POLICY "Service role has full access to users"
ON public.users FOR ALL
USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- TABLE ARTICLES : Activer RLS
-- ═══════════════════════════════════════════════════════════════

-- Activer RLS sur la table articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own articles" ON public.articles;
DROP POLICY IF EXISTS "Users can create articles" ON public.articles;
DROP POLICY IF EXISTS "Users can update own articles" ON public.articles;
DROP POLICY IF EXISTS "Users can delete own articles" ON public.articles;
DROP POLICY IF EXISTS "Service role has full access to articles" ON public.articles;

-- Note: Pour articles, user_id correspond à l'ID interne de la table users
-- On doit donc faire une sous-requête pour vérifier

-- Politique : Users peuvent voir leurs propres articles
CREATE POLICY "Users can view own articles"
ON public.articles FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Politique : Users peuvent créer des articles
CREATE POLICY "Users can create articles"
ON public.articles FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Politique : Users peuvent modifier leurs articles
CREATE POLICY "Users can update own articles"
ON public.articles FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Politique : Users peuvent supprimer leurs articles
CREATE POLICY "Users can delete own articles"
ON public.articles FOR DELETE
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Politique : Service role a accès total
CREATE POLICY "Service role has full access to articles"
ON public.articles FOR ALL
USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- TABLE ONE_TIME_PURCHASES : Activer RLS
-- ═══════════════════════════════════════════════════════════════

-- Activer RLS sur la table one_time_purchases
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view own purchases" ON public.one_time_purchases;
DROP POLICY IF EXISTS "Service role has full access to purchases" ON public.one_time_purchases;

-- Politique : Users peuvent voir leurs propres achats
CREATE POLICY "Users can view own purchases"
ON public.one_time_purchases FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Politique : Service role a accès total (pour créer les achats via webhook)
CREATE POLICY "Service role has full access to purchases"
ON public.one_time_purchases FOR ALL
USING (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════

-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'articles', 'one_time_purchases');

-- Lister toutes les politiques créées
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ═══════════════════════════════════════════════════════════════
-- FIN DU SCRIPT RLS
-- ═══════════════════════════════════════════════════════════════


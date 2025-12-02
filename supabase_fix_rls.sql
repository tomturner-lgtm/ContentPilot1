-- ============================================
-- FIX RLS POLICIES - ContentPilot
-- ============================================
-- Ce script corrige les warnings du linter Supabase :
-- 1. Remplace auth.uid() par (select auth.uid()) pour optimiser les performances
-- 2. Supprime les politiques dupliquées
-- ============================================

-- ============================================
-- 1. SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- ============================================

-- Supprimer toutes les politiques pour éviter les doublons
DROP POLICY IF EXISTS "Users can view their own quota" ON user_quotas;
DROP POLICY IF EXISTS "Users can update their own quota" ON user_quotas;
DROP POLICY IF EXISTS "Users can insert their own quota" ON user_quotas;
DROP POLICY IF EXISTS "Users can view their own purchases" ON one_time_purchases;
DROP POLICY IF EXISTS "Users can update their own purchases" ON one_time_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON one_time_purchases;
DROP POLICY IF EXISTS "Users view own" ON one_time_purchases;
DROP POLICY IF EXISTS "Users can view their own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;
DROP POLICY IF EXISTS "Users can manage own articles" ON articles;
DROP POLICY IF EXISTS "Users can view their own WordPress config" ON wordpress_configs;
DROP POLICY IF EXISTS "Users can create their own WordPress config" ON wordpress_configs;
DROP POLICY IF EXISTS "Users can update their own WordPress config" ON wordpress_configs;
DROP POLICY IF EXISTS "Users can delete their own WordPress config" ON wordpress_configs;

-- ============================================
-- 2. RECRÉER LES POLITIQUES AVEC (select auth.uid())
-- ============================================

-- Policies pour user_quotas (optimisées)
CREATE POLICY "Users can view their own quota" 
  ON user_quotas FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own quota" 
  ON user_quotas FOR UPDATE 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own quota" 
  ON user_quotas FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- Policies pour one_time_purchases (optimisées, une seule politique par action)
CREATE POLICY "Users can view their own purchases" 
  ON one_time_purchases FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own purchases" 
  ON one_time_purchases FOR UPDATE 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own purchases" 
  ON one_time_purchases FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- Policies pour articles (optimisées, une seule politique par action)
-- Note: On garde les politiques spécifiques plutôt qu'une politique "manage" pour plus de clarté
CREATE POLICY "Users can view their own articles" 
  ON articles FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own articles" 
  ON articles FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own articles" 
  ON articles FOR UPDATE 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own articles" 
  ON articles FOR DELETE 
  USING ((select auth.uid()) = user_id);

-- Policies pour wordpress_configs (optimisées)
CREATE POLICY "Users can view their own WordPress config" 
  ON wordpress_configs FOR SELECT 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own WordPress config" 
  ON wordpress_configs FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own WordPress config" 
  ON wordpress_configs FOR UPDATE 
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own WordPress config" 
  ON wordpress_configs FOR DELETE 
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 3. VÉRIFICATION
-- ============================================

-- Vérifier que les politiques sont bien créées
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

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- 
-- Après exécution, les warnings du linter devraient disparaître.
-- Les politiques utilisent maintenant (select auth.uid()) pour une meilleure performance.
-- 
-- ============================================



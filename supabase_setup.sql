-- ============================================
-- SUPABASE BACKEND SETUP - ContentPilot
-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

-- Table: user_quotas
-- Gère les quotas et plans des utilisateurs
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  articles_limit INTEGER NOT NULL DEFAULT 1,
  articles_used INTEGER NOT NULL DEFAULT 0,
  reset_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 month'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Table: one_time_purchases
-- Gère les achats uniques (test à 5€)
CREATE TABLE IF NOT EXISTS one_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT false,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: articles
-- Stocke tous les articles générés
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keyword TEXT,
  language TEXT DEFAULT 'fr',
  template TEXT,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: wordpress_configs
-- Stocke les configurations WordPress des utilisateurs
CREATE TABLE IF NOT EXISTS wordpress_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_url TEXT NOT NULL,
  username TEXT NOT NULL,
  application_password TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- 2. INDEXES (pour optimiser les requêtes)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_stripe_customer_id ON user_quotas(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_user_id ON one_time_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_used ON one_time_purchases(user_id, used) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wordpress_configs_user_id ON wordpress_configs(user_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_configs ENABLE ROW LEVEL SECURITY;

-- Policies pour user_quotas (optimisées avec select auth.uid())
DROP POLICY IF EXISTS "Users can view their own quota" ON user_quotas;
CREATE POLICY "Users can view their own quota" 
  ON user_quotas FOR SELECT 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own quota" ON user_quotas;
CREATE POLICY "Users can update their own quota" 
  ON user_quotas FOR UPDATE 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own quota" ON user_quotas;
CREATE POLICY "Users can insert their own quota" 
  ON user_quotas FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- Policies pour one_time_purchases (optimisées avec select auth.uid())
DROP POLICY IF EXISTS "Users can view their own purchases" ON one_time_purchases;
CREATE POLICY "Users can view their own purchases" 
  ON one_time_purchases FOR SELECT 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own purchases" ON one_time_purchases;
CREATE POLICY "Users can update their own purchases" 
  ON one_time_purchases FOR UPDATE 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own purchases" ON one_time_purchases;
CREATE POLICY "Users can insert their own purchases" 
  ON one_time_purchases FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

-- Policies pour articles (optimisées avec select auth.uid())
DROP POLICY IF EXISTS "Users can view their own articles" ON articles;
CREATE POLICY "Users can view their own articles" 
  ON articles FOR SELECT 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
CREATE POLICY "Users can insert their own articles" 
  ON articles FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
CREATE POLICY "Users can update their own articles" 
  ON articles FOR UPDATE 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;
CREATE POLICY "Users can delete their own articles" 
  ON articles FOR DELETE 
  USING ((select auth.uid()) = user_id);

-- Policies pour wordpress_configs (optimisées avec select auth.uid())
DROP POLICY IF EXISTS "Users can view their own WordPress config" ON wordpress_configs;
CREATE POLICY "Users can view their own WordPress config" 
  ON wordpress_configs FOR SELECT 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own WordPress config" ON wordpress_configs;
CREATE POLICY "Users can create their own WordPress config" 
  ON wordpress_configs FOR INSERT 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own WordPress config" ON wordpress_configs;
CREATE POLICY "Users can update their own WordPress config" 
  ON wordpress_configs FOR UPDATE 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own WordPress config" ON wordpress_configs;
CREATE POLICY "Users can delete their own WordPress config" 
  ON wordpress_configs FOR DELETE 
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 4. DATABASE FUNCTIONS
-- ============================================

-- Function: Créer un quota pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION handle_new_user_quota()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
  VALUES (NEW.id, 'free', 1, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function: Réinitialiser les quotas mensuels
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_quotas
  SET 
    articles_used = 0,
    reset_date = now() + interval '1 month'
  WHERE 
    reset_date <= now()
    AND plan_type IN ('free', 'pro');
END;
$$;

-- Function: Vérifier et utiliser le quota
CREATE OR REPLACE FUNCTION check_and_use_quota(p_user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_quota RECORD;
  v_one_time RECORD;
  v_result JSON;
BEGIN
  -- Vérifier si l'utilisateur a un achat one-time non utilisé
  SELECT * INTO v_one_time
  FROM one_time_purchases
  WHERE user_id = p_user_id AND used = false
  LIMIT 1
  FOR UPDATE;

  IF v_one_time IS NOT NULL THEN
    -- Utiliser l'achat one-time
    UPDATE one_time_purchases
    SET used = true, updated_at = now()
    WHERE id = v_one_time.id;
    
    RETURN json_build_object(
      'success', true,
      'type', 'one_time',
      'message', 'Achat one-time utilisé'
    );
  END IF;

  -- Vérifier le quota normal
  SELECT * INTO v_quota
  FROM user_quotas
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_quota IS NULL THEN
    -- Créer un quota par défaut si inexistant
    INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
    VALUES (p_user_id, 'free', 1, 0)
    RETURNING * INTO v_quota;
  END IF;

  -- Vérifier si le quota doit être réinitialisé
  IF v_quota.reset_date <= now() THEN
    UPDATE user_quotas
    SET articles_used = 0, reset_date = now() + interval '1 month'
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;
  END IF;

  -- Vérifier si l'utilisateur a encore des articles disponibles
  IF v_quota.plan_type = 'unlimited' THEN
    -- Plan illimité : toujours autorisé
    RETURN json_build_object(
      'success', true,
      'type', 'quota',
      'message', 'Plan illimité'
    );
  ELSIF v_quota.articles_used < v_quota.articles_limit THEN
    -- Incrémenter le compteur
    UPDATE user_quotas
    SET articles_used = articles_used + 1, updated_at = now()
    WHERE id = v_quota.id;
    
    RETURN json_build_object(
      'success', true,
      'type', 'quota',
      'articles_used', v_quota.articles_used + 1,
      'articles_limit', v_quota.articles_limit,
      'message', 'Quota utilisé'
    );
  ELSE
    -- Quota épuisé
    RETURN json_build_object(
      'success', false,
      'type', 'quota',
      'articles_used', v_quota.articles_used,
      'articles_limit', v_quota.articles_limit,
      'message', 'Quota épuisé'
    );
  END IF;
END;
$$;

-- Function: Obtenir le quota de l'utilisateur
CREATE OR REPLACE FUNCTION get_user_quota(p_user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_quota RECORD;
  v_one_time_count INTEGER;
BEGIN
  -- Récupérer le quota
  SELECT * INTO v_quota
  FROM user_quotas
  WHERE user_id = p_user_id;

  -- Compter les achats one-time non utilisés
  SELECT COUNT(*) INTO v_one_time_count
  FROM one_time_purchases
  WHERE user_id = p_user_id AND used = false;

  -- Créer un quota par défaut si inexistant
  IF v_quota IS NULL THEN
    INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
    VALUES (p_user_id, 'free', 1, 0)
    RETURNING * INTO v_quota;
  END IF;

  -- Vérifier si le quota doit être réinitialisé
  IF v_quota.reset_date <= now() THEN
    UPDATE user_quotas
    SET articles_used = 0, reset_date = now() + interval '1 month'
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;
  END IF;

  RETURN json_build_object(
    'plan_type', v_quota.plan_type,
    'articles_limit', v_quota.articles_limit,
    'articles_used', v_quota.articles_used,
    'articles_remaining', GREATEST(0, v_quota.articles_limit - v_quota.articles_used),
    'reset_date', v_quota.reset_date,
    'one_time_purchases_available', COALESCE(v_one_time_count, 0),
    'has_unlimited', v_quota.plan_type = 'unlimited'
  );
END;
$$;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger: Créer un quota lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_quota();

-- Trigger: Mettre à jour updated_at sur user_quotas
DROP TRIGGER IF EXISTS update_user_quotas_updated_at ON user_quotas;
CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Mettre à jour updated_at sur one_time_purchases
DROP TRIGGER IF EXISTS update_one_time_purchases_updated_at ON one_time_purchases;
CREATE TRIGGER update_one_time_purchases_updated_at
  BEFORE UPDATE ON one_time_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Mettre à jour updated_at sur articles
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Mettre à jour updated_at sur wordpress_configs
DROP TRIGGER IF EXISTS update_wordpress_configs_updated_at ON wordpress_configs;
CREATE TRIGGER update_wordpress_configs_updated_at
  BEFORE UPDATE ON wordpress_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CRON JOB (Optionnel - pour réinitialiser les quotas)
-- ============================================
-- Note: Activez l'extension pg_cron dans Supabase si disponible
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 
-- SELECT cron.schedule(
--   'reset-monthly-quotas',
--   '0 0 1 * *', -- Le 1er de chaque mois à minuit
--   $$SELECT reset_monthly_quotas();$$
-- );

-- ============================================
-- 7. GRANTS (Permissions)
-- ============================================

-- S'assurer que les fonctions sont accessibles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- 
-- PROCHAINES ÉTAPES :
-- 
-- 1. Exécutez ce script dans l'éditeur SQL de Supabase
-- 2. Configurez les Edge Functions (voir documentation séparée)
-- 3. Configurez les secrets dans Supabase Dashboard > Settings > Edge Functions
-- 4. Activez l'authentification email/password dans Authentication > Providers
-- 5. Activez "Auto-confirm email" dans Authentication > Settings
-- 
-- ============================================


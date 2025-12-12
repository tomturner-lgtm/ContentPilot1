-- ==============================================================================
-- CONTENTPILOT - AUDIT COMPLET DES QUOTAS ET STRUCTURE DB
-- ==============================================================================
-- Exécutez ces requêtes dans l'éditeur SQL de Supabase Dashboard
-- ==============================================================================

-- ═══════════════════════════════════════════════════════════════
-- CHECK 1 : VÉRIFIER LA STRUCTURE DE LA TABLE USERS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════
-- CHECK 2 : AJOUTER LES COLONNES MANQUANTES (si nécessaire)
-- ═══════════════════════════════════════════════════════════════

-- Décommentez et exécutez si des colonnes manquent :

-- ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS quota_reset_date TIMESTAMPTZ;
-- ALTER TABLE users ALTER COLUMN articles_used SET DEFAULT 0;
-- ALTER TABLE users ALTER COLUMN articles_limit SET DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════
-- CHECK 3 : CRÉER LES INDEX POUR OPTIMISATION
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(stripe_subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_quota_reset ON users(quota_reset_date) WHERE quota_reset_date IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- CHECK 4 : AUDIT DES DONNÉES - DÉTECTER LES ANOMALIES
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ Users avec abonnement actif mais sans stripe_subscription_id
SELECT id, email, plan, stripe_subscription_status, stripe_subscription_id
FROM users
WHERE stripe_subscription_status = 'active' 
AND stripe_subscription_id IS NULL;

-- 2️⃣ Users avec articles_used > articles_limit (dépassement)
SELECT id, email, plan, articles_used, articles_limit
FROM users
WHERE articles_used > articles_limit
AND articles_limit > 0;

-- 3️⃣ Users avec quota_reset_date dépassée (devraient être réinitialisés)
SELECT id, email, plan, articles_used, articles_limit, quota_reset_date
FROM users
WHERE quota_reset_date < NOW()
AND stripe_subscription_status = 'active';

-- 4️⃣ Users avec plan mais pas d'articles_limit correcte
SELECT id, email, plan, articles_limit
FROM users
WHERE plan IS NOT NULL
AND (articles_limit IS NULL OR articles_limit = 0);

-- 5️⃣ Résumé des utilisateurs par plan
SELECT 
  COALESCE(plan, 'free') as plan_type,
  COUNT(*) as user_count,
  AVG(articles_used) as avg_articles_used,
  AVG(articles_limit) as avg_articles_limit
FROM users
GROUP BY plan
ORDER BY user_count DESC;

-- ═══════════════════════════════════════════════════════════════
-- CHECK 5 : VÉRIFIER LA COHÉRENCE articles_used vs articles réels
-- ═══════════════════════════════════════════════════════════════

-- Compter les articles par user et comparer avec articles_used
SELECT 
  u.id,
  u.email,
  u.plan,
  u.articles_used as compteur_db,
  COUNT(a.id) as articles_reels,
  u.articles_limit,
  CASE 
    WHEN COUNT(a.id) != u.articles_used THEN '❌ DÉSYNCHRONISÉ'
    ELSE '✅ OK'
  END as status
FROM users u
LEFT JOIN articles a ON a.user_id = u.id
WHERE u.plan IS NOT NULL
GROUP BY u.id, u.email, u.plan, u.articles_used, u.articles_limit
ORDER BY status DESC, u.email;

-- ═══════════════════════════════════════════════════════════════
-- CORRECTIONS AUTOMATIQUES (DÉCOMMENTEZ SI NÉCESSAIRE)
-- ═══════════════════════════════════════════════════════════════

-- Corriger users avec plan 'pro' mais mauvaise limite
-- UPDATE users SET articles_limit = 30 WHERE plan = 'pro' AND articles_limit != 30;

-- Corriger users avec plan 'max' mais mauvaise limite
-- UPDATE users SET articles_limit = 200 WHERE plan = 'max' AND articles_limit != 200;

-- Corriger users avec plan 'test' mais mauvaise limite
-- UPDATE users SET articles_limit = 1 WHERE plan = 'test' AND articles_limit != 1;

-- Reset quota pour users avec quota_reset_date dépassée
-- UPDATE users
-- SET articles_used = 0, quota_reset_date = NOW() + INTERVAL '30 days'
-- WHERE quota_reset_date < NOW() AND stripe_subscription_status = 'active';

-- Resynchroniser articles_used avec le nombre réel d'articles
-- UPDATE users u
-- SET articles_used = (SELECT COUNT(*) FROM articles a WHERE a.user_id = u.id)
-- WHERE u.id IN (
--   SELECT u2.id FROM users u2
--   LEFT JOIN articles a2 ON a2.user_id = u2.id
--   GROUP BY u2.id
--   HAVING COUNT(a2.id) != u2.articles_used
-- );

-- ═══════════════════════════════════════════════════════════════
-- CHECK 6 : VÉRIFIER LES FONCTIONS RPC
-- ═══════════════════════════════════════════════════════════════

-- Lister les fonctions RPC existantes
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('check_and_use_quota', 'get_user_quota', 'update_subscription_from_stripe');

-- ═══════════════════════════════════════════════════════════════
-- CHECK 7 : STRUCTURE TABLE ARTICLES
-- ═══════════════════════════════════════════════════════════════

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;

-- Index pour articles
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- CHECK 8 : TABLE ONE_TIME_PURCHASES
-- ═══════════════════════════════════════════════════════════════

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'one_time_purchases'
ORDER BY ordinal_position;

-- Achats one-time non utilisés par user
SELECT 
  u.email,
  COUNT(otp.id) as achats_disponibles
FROM users u
JOIN one_time_purchases otp ON otp.user_id = u.id
WHERE otp.used = false
GROUP BY u.email;

-- ═══════════════════════════════════════════════════════════════
-- FIN DE L'AUDIT
-- ═══════════════════════════════════════════════════════════════


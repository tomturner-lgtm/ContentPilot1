-- ================================================
-- MIGRATION: UPDATE MAX PLAN QUOTA TO 200
-- ================================================

-- 1. Mettre à jour tous les utilisateurs avec le plan 'max'
UPDATE user_quotas
SET articles_limit = 200
WHERE plan_type = 'max';

-- 2. Mettre à jour les utilisateurs avec le plan 'unlimited' (legacy) vers 'max'
UPDATE user_quotas
SET plan_type = 'max',
    articles_limit = 200
WHERE plan_type = 'unlimited';

-- 3. Vérification (Optionnel)
SELECT count(*) as updated_users 
FROM user_quotas 
WHERE plan_type = 'max' AND articles_limit = 200;

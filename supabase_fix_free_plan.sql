-- ==============================================================================
-- MIGRATION : Corriger les utilisateurs avec plan='free' ou mal assignés
-- ==============================================================================

-- 1. Mettre à null tous les utilisateurs avec plan='free' (plan invalide)
UPDATE public.users
SET 
    plan = NULL,
    articles_limit = 0
WHERE plan = 'free';

-- 2. Afficher les utilisateurs pour vérification
SELECT id, email, plan, articles_limit, stripe_subscription_status
FROM public.users
ORDER BY created_at DESC;

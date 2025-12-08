-- ==============================================================================
-- FIX: Corriger les articles existants qui ont user_id = auth_id
-- ==============================================================================
-- Ce script corrige les articles qui ont été créés avec session.user.id (auth_id)
-- au lieu de users.id (internal table ID)
-- ==============================================================================

-- Mise à jour des articles : remplacer l'auth_id par users.id
UPDATE public.articles a
SET user_id = u.id
FROM public.users u
WHERE a.user_id = u.auth_id;

-- Vérification
SELECT 
    a.id as article_id,
    a.title,
    a.user_id,
    u.email
FROM public.articles a
JOIN public.users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

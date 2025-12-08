-- ==============================================================================
-- CONTENTPILOT - FONCTIONS RPC POUR TABLE USERS
-- ==============================================================================
-- Ces fonctions remplacent les anciennes qui utilisaient user_quotas
-- ==============================================================================

-- =====================
-- SUPPRIMER LES ANCIENNES FONCTIONS
-- =====================

DROP FUNCTION IF EXISTS public.check_and_use_quota(UUID);
DROP FUNCTION IF EXISTS public.get_user_quota(UUID);
DROP FUNCTION IF EXISTS public.update_subscription_from_stripe(TEXT, TEXT, TEXT, TEXT);

-- =====================
-- check_and_use_quota : Vérifie et consomme un article du quota
-- =====================

CREATE OR REPLACE FUNCTION public.check_and_use_quota(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Récupérer l'utilisateur via auth_id
    SELECT id, plan, articles_limit, articles_used, quota_reset_date
    INTO v_user
    FROM public.users
    WHERE auth_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Utilisateur non trouvé');
    END IF;

    -- Vérifier si on doit réinitialiser le quota (nouveau mois)
    IF v_user.quota_reset_date IS NOT NULL AND v_now >= v_user.quota_reset_date THEN
        UPDATE public.users
        SET 
            articles_used = 0,
            quota_reset_date = date_trunc('month', v_now) + INTERVAL '1 month',
            updated_at = v_now
        WHERE id = v_user.id;
        
        v_user.articles_used := 0;
    END IF;

    -- Vérifier si l'utilisateur a du quota disponible
    IF v_user.articles_used >= v_user.articles_limit THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Quota épuisé. Passez au plan supérieur pour plus d''articles.',
            'used', v_user.articles_used,
            'limit', v_user.articles_limit
        );
    END IF;

    -- Incrémenter le compteur
    UPDATE public.users
    SET 
        articles_used = articles_used + 1,
        updated_at = v_now
    WHERE id = v_user.id;

    RETURN jsonb_build_object(
        'success', true,
        'used', v_user.articles_used + 1,
        'limit', v_user.articles_limit,
        'remaining', v_user.articles_limit - v_user.articles_used - 1
    );
END;
$$;

-- =====================
-- get_user_quota : Récupère les infos de quota d'un utilisateur
-- =====================

CREATE OR REPLACE FUNCTION public.get_user_quota(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
BEGIN
    SELECT id, plan, billing_period, articles_limit, articles_used, quota_reset_date
    INTO v_user
    FROM public.users
    WHERE auth_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Utilisateur non trouvé');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'plan', v_user.plan,
        'billing_period', v_user.billing_period,
        'articles_limit', v_user.articles_limit,
        'articles_used', v_user.articles_used,
        'remaining', GREATEST(0, v_user.articles_limit - v_user.articles_used),
        'reset_date', v_user.quota_reset_date
    );
END;
$$;

-- =====================
-- update_subscription_from_stripe : Met à jour le plan depuis Stripe
-- =====================

CREATE OR REPLACE FUNCTION public.update_subscription_from_stripe(
    user_email TEXT,
    plan_name TEXT,
    customer_id TEXT,
    subscription_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_articles_limit INTEGER;
BEGIN
    -- Déterminer la limite d'articles selon le plan
    CASE plan_name
        WHEN 'test' THEN v_articles_limit := 1;
        WHEN 'pro' THEN v_articles_limit := 30;
        WHEN 'max' THEN v_articles_limit := 200;
        ELSE v_articles_limit := 0;  -- free
    END CASE;

    -- Mettre à jour l'utilisateur
    UPDATE public.users
    SET 
        plan = plan_name,
        articles_limit = v_articles_limit,
        stripe_customer_id = customer_id,
        stripe_subscription_id = subscription_id,
        stripe_subscription_status = CASE WHEN subscription_id IS NOT NULL THEN 'active' ELSE NULL END,
        updated_at = NOW()
    WHERE email = user_email;
END;
$$;

-- =====================
-- PERMISSIONS
-- =====================

-- Permettre aux utilisateurs authentifiés d'appeler ces fonctions
GRANT EXECUTE ON FUNCTION public.check_and_use_quota(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_quota(UUID) TO authenticated;
-- update_subscription_from_stripe est appelé par le backend seulement

-- FIN

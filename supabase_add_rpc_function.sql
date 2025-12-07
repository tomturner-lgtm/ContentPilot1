-- ============================================
-- Function: update_subscription_from_stripe
-- ============================================
-- Cette fonction est utilisée par le webhook Stripe
-- pour mettre à jour les quotas utilisateurs
-- ============================================

CREATE OR REPLACE FUNCTION update_subscription_from_stripe(
  user_email TEXT,
  plan_name TEXT,
  customer_id TEXT,
  subscription_id TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_articles_limit INTEGER;
BEGIN
  -- Trouver l'utilisateur par email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;

  -- Déterminer la limite d'articles selon le plan
  -- Note: Le plan "free" a été supprimé, remplacé par "test" (achat one-time à 5€)
  CASE plan_name
    WHEN 'test' THEN
      v_articles_limit := 1; -- Achat one-time à 5€ = 1 article
    WHEN 'free' THEN
      v_articles_limit := 1; -- Fallback pour compatibilité
    WHEN 'pro' THEN
      v_articles_limit := 10;
    WHEN 'max' THEN
      v_articles_limit := 200;
    WHEN 'unlimited' THEN
      v_articles_limit := 200; -- Legacy mapping if needed
    ELSE
      v_articles_limit := 1;
  END CASE;

  -- Mettre à jour ou créer le quota
  INSERT INTO user_quotas (
    user_id,
    plan_type,
    articles_limit,
    articles_used,
    stripe_customer_id,
    stripe_subscription_id,
    reset_date
  )
  VALUES (
    v_user_id,
    plan_name,
    v_articles_limit,
    0, -- Réinitialiser les articles utilisés
    customer_id,
    subscription_id,
    now() + interval '1 month'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    articles_limit = EXCLUDED.articles_limit,
    articles_used = 0, -- Réinitialiser lors d'un changement de plan
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    reset_date = now() + interval '1 month',
    updated_at = now();

END;
$$;

-- ============================================
-- FIN
-- ============================================


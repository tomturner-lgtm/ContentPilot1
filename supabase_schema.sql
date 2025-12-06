-- ================================================
-- CONTENTPILOT - SCHEMA AVEC PAYWALL
-- Nouveaux users = 0 articles (doivent payer)
-- ================================================

-- ================================================
-- ÉTAPE 1: SUPPRIMER LES ANCIENNES TABLES
-- ================================================

DROP TABLE IF EXISTS wordpress_configs CASCADE;
DROP TABLE IF EXISTS one_time_purchases CASCADE;
DROP TABLE IF EXISTS user_quotas CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ================================================
-- ÉTAPE 2: TABLE DES QUOTAS
-- Un user a UN quota lié à sa subscription
-- Par défaut: 0 articles (doit payer)
-- ================================================

CREATE TABLE user_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Plan: 'free' (0 articles), 'test' (1 article one-time), 'pro', 'max'
    plan_type TEXT DEFAULT 'free',
    
    -- Limite mensuelle selon le plan
    articles_limit INTEGER DEFAULT 0,  -- FREE = 0 par défaut !
    articles_used INTEGER DEFAULT 0,
    
    -- Date de reset mensuel
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 3: ACHATS PONCTUELS (5€ = 1 article)
-- Chaque achat donne 1 article utilisable
-- ================================================

CREATE TABLE one_time_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Stripe payment ID
    stripe_payment_id TEXT,
    
    -- false = non utilisé, true = article généré
    used BOOLEAN DEFAULT FALSE,
    
    -- Date d'utilisation
    used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 4: ARTICLES GÉNÉRÉS
-- Historique de tous les articles créés
-- ================================================

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contenu
    title TEXT NOT NULL,
    keyword TEXT,
    content TEXT,
    word_count INTEGER,
    
    -- Template utilisé
    template TEXT,
    language TEXT DEFAULT 'fr',
    
    -- Source du quota: 'subscription' ou 'one_time_purchase'
    quota_source TEXT DEFAULT 'subscription',
    one_time_purchase_id UUID REFERENCES one_time_purchases(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 5: CONFIGS WORDPRESS
-- ================================================

CREATE TABLE wordpress_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    site_url TEXT NOT NULL,
    username TEXT NOT NULL,
    application_password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDEX POUR PERFORMANCES
-- ================================================

CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX idx_one_time_purchases_user_id ON one_time_purchases(user_id);
CREATE INDEX idx_one_time_purchases_unused ON one_time_purchases(user_id, used) WHERE used = FALSE;
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_created ON articles(user_id, created_at DESC);

-- ================================================
-- FONCTION: get_user_quota
-- Retourne le quota complet d'un user
-- ================================================

CREATE OR REPLACE FUNCTION get_user_quota(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_quota user_quotas%ROWTYPE;
    v_one_time_count INTEGER;
    v_can_generate BOOLEAN;
    v_articles_remaining INTEGER;
BEGIN
    -- Récupérer le quota
    SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id;
    
    -- Si pas de quota, créer avec 0 articles (FREE = paywall)
    IF v_quota IS NULL THEN
        INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
        VALUES (p_user_id, 'free', 0, 0)
        RETURNING * INTO v_quota;
    END IF;
    
    -- Reset mensuel si nécessaire
    IF v_quota.reset_date < NOW() AND v_quota.plan_type != 'free' THEN
        UPDATE user_quotas 
        SET articles_used = 0, 
            reset_date = date_trunc('month', NOW()) + INTERVAL '1 month',
            updated_at = NOW()
        WHERE user_id = p_user_id
        RETURNING * INTO v_quota;
    END IF;
    
    -- Compter les achats ponctuels non utilisés
    SELECT COUNT(*) INTO v_one_time_count 
    FROM one_time_purchases 
    WHERE user_id = p_user_id AND used = FALSE;
    
    -- Calculer articles restants
    v_articles_remaining := GREATEST(0, v_quota.articles_limit - v_quota.articles_used);
    
    -- Peut générer si: quota restant OU achat ponctuel disponible
    v_can_generate := (v_articles_remaining > 0) OR (v_one_time_count > 0);
    
    -- Résultat
    result := json_build_object(
        'plan_type', v_quota.plan_type,
        'articles_limit', v_quota.articles_limit,
        'articles_used', v_quota.articles_used,
        'articles_remaining', v_articles_remaining,
        'reset_date', v_quota.reset_date,
        'one_time_purchases_available', v_one_time_count,
        'can_generate', v_can_generate,
        'has_unlimited', v_quota.articles_limit >= 999999,
        'has_subscription', v_quota.plan_type IN ('pro', 'max', 'unlimited'),
        'stripe_customer_id', v_quota.stripe_customer_id,
        'stripe_subscription_id', v_quota.stripe_subscription_id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- FONCTION: use_quota
-- Utilise 1 article du quota (appelé après génération)
-- ================================================

CREATE OR REPLACE FUNCTION use_quota(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_quota user_quotas%ROWTYPE;
    v_one_time one_time_purchases%ROWTYPE;
    v_source TEXT;
BEGIN
    SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id;
    
    -- Vérifier s'il reste du quota subscription
    IF v_quota.articles_limit > v_quota.articles_used THEN
        -- Utiliser le quota subscription
        UPDATE user_quotas 
        SET articles_used = articles_used + 1, updated_at = NOW()
        WHERE user_id = p_user_id;
        v_source := 'subscription';
    ELSE
        -- Essayer d'utiliser un achat ponctuel
        SELECT * INTO v_one_time 
        FROM one_time_purchases 
        WHERE user_id = p_user_id AND used = FALSE 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF v_one_time.id IS NOT NULL THEN
            UPDATE one_time_purchases 
            SET used = TRUE, used_at = NOW()
            WHERE id = v_one_time.id;
            v_source := 'one_time_purchase';
        ELSE
            RETURN json_build_object('success', FALSE, 'error', 'No quota available');
        END IF;
    END IF;
    
    RETURN json_build_object('success', TRUE, 'source', v_source);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- TRIGGER: Créer quota à l'inscription
-- ================================================

CREATE OR REPLACE FUNCTION create_user_quota_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
    VALUES (NEW.id, 'free', 0, 0)  -- FREE = 0 articles !
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_quota_on_signup();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_configs ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture
CREATE POLICY "Users read own quota" ON user_quotas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own purchases" ON one_time_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users read own wordpress" ON wordpress_configs FOR SELECT USING (auth.uid() = user_id);

-- Politiques d'écriture (articles et wordpress)
CREATE POLICY "Users insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own wordpress" ON wordpress_configs FOR ALL USING (auth.uid() = user_id);

-- Service role peut tout faire (pour l'API backend)
CREATE POLICY "Service role full access quotas" ON user_quotas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access purchases" ON one_time_purchases FOR ALL USING (auth.role() = 'service_role');

-- ================================================
-- TERMINÉ !
-- ================================================

SELECT 'Schema créé avec succès! Nouveaux users = 0 articles (paywall actif)' as status;

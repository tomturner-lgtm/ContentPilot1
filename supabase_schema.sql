-- ================================================
-- CONTENTPILOT - SCHEMA SAAS COMPLET & SCALABLE
-- Base de données professionnelle pour scale
-- ================================================

-- ================================================
-- ÉTAPE 1: NETTOYER LES ANCIENNES TABLES
-- ================================================

DROP TABLE IF EXISTS wordpress_configs CASCADE;
DROP TABLE IF EXISTS one_time_purchases CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS user_quotas CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ================================================
-- ÉTAPE 2: TABLE PROFILES (Données utilisateur)
-- Stocke toutes les infos personnelles du user
-- ================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Identité
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    
    -- Entreprise (optionnel)
    company_name TEXT,
    website_url TEXT,
    
    -- Préférences
    preferred_language TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Europe/Paris',
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 3: TABLE USER_QUOTAS (Abonnement & Quota)
-- Gère le plan, les limites, Stripe
-- ================================================

CREATE TABLE user_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Plan: 'free', 'test', 'pro', 'max'
    plan_type TEXT DEFAULT 'free',
    billing_period TEXT DEFAULT 'monthly', -- 'monthly' ou 'yearly'
    
    -- Limites
    articles_limit INTEGER DEFAULT 0,  -- FREE = 0 (paywall)
    articles_used INTEGER DEFAULT 0,
    
    -- Reset mensuel
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT, -- 'active', 'canceled', 'past_due'
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 4: TABLE ONE_TIME_PURCHASES (Achats 5€)
-- ================================================

CREATE TABLE one_time_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Stripe
    stripe_payment_id TEXT,
    amount_paid INTEGER DEFAULT 500, -- En centimes (5€ = 500)
    
    -- Statut
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 5: TABLE ARTICLES (Historique générations)
-- ================================================

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contenu
    title TEXT NOT NULL,
    keyword TEXT,
    content TEXT,
    word_count INTEGER,
    
    -- Configuration utilisée
    template TEXT,
    language TEXT DEFAULT 'fr',
    target_length INTEGER,
    
    -- Source du crédit utilisé
    quota_source TEXT DEFAULT 'subscription', -- 'subscription' ou 'one_time_purchase'
    one_time_purchase_id UUID REFERENCES one_time_purchases(id),
    
    -- Statut
    is_published BOOLEAN DEFAULT FALSE,
    published_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 6: TABLE WORDPRESS_CONFIGS
-- ================================================

CREATE TABLE wordpress_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Config WordPress
    site_name TEXT,
    site_url TEXT NOT NULL,
    username TEXT NOT NULL,
    application_password TEXT NOT NULL,
    
    -- Vérification
    is_verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- ÉTAPE 7: INDEX POUR PERFORMANCES
-- ================================================

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX idx_user_quotas_stripe_customer ON user_quotas(stripe_customer_id);
CREATE INDEX idx_one_time_purchases_user_id ON one_time_purchases(user_id);
CREATE INDEX idx_one_time_purchases_unused ON one_time_purchases(user_id, used) WHERE used = FALSE;
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_created ON articles(user_id, created_at DESC);
CREATE INDEX idx_wordpress_configs_user_id ON wordpress_configs(user_id);

-- ================================================
-- ÉTAPE 8: FONCTION get_user_profile
-- Retourne le profil complet avec quota
-- ================================================

CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_quota user_quotas%ROWTYPE;
    v_one_time_count INTEGER;
    v_articles_count INTEGER;
    v_result JSON;
BEGIN
    -- Récupérer le profil
    SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
    
    -- Récupérer le quota
    SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id;
    
    -- Compter les achats ponctuels disponibles
    SELECT COUNT(*) INTO v_one_time_count 
    FROM one_time_purchases 
    WHERE user_id = p_user_id AND used = FALSE;
    
    -- Compter les articles générés
    SELECT COUNT(*) INTO v_articles_count 
    FROM articles 
    WHERE user_id = p_user_id;
    
    -- Construire le résultat
    v_result := json_build_object(
        'profile', json_build_object(
            'id', v_profile.id,
            'email', v_profile.email,
            'first_name', v_profile.first_name,
            'last_name', v_profile.last_name,
            'full_name', COALESCE(v_profile.first_name, '') || ' ' || COALESCE(v_profile.last_name, ''),
            'company_name', v_profile.company_name,
            'website_url', v_profile.website_url,
            'avatar_url', v_profile.avatar_url,
            'onboarding_completed', v_profile.onboarding_completed
        ),
        'subscription', json_build_object(
            'plan_type', COALESCE(v_quota.plan_type, 'free'),
            'billing_period', COALESCE(v_quota.billing_period, 'monthly'),
            'articles_limit', COALESCE(v_quota.articles_limit, 0),
            'articles_used', COALESCE(v_quota.articles_used, 0),
            'articles_remaining', GREATEST(0, COALESCE(v_quota.articles_limit, 0) - COALESCE(v_quota.articles_used, 0)),
            'reset_date', v_quota.reset_date,
            'stripe_subscription_status', v_quota.stripe_subscription_status,
            'subscription_end_date', v_quota.subscription_end_date
        ),
        'stats', json_build_object(
            'total_articles', v_articles_count,
            'one_time_credits', v_one_time_count
        ),
        'can_generate', (
            COALESCE(v_quota.articles_limit, 0) > COALESCE(v_quota.articles_used, 0)
            OR v_one_time_count > 0
        )
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 9: FONCTION get_user_quota (compatibilité)
-- ================================================

CREATE OR REPLACE FUNCTION get_user_quota(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_quota user_quotas%ROWTYPE;
    v_one_time_count INTEGER;
BEGIN
    SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id;
    
    -- Créer quota par défaut si inexistant
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
    
    -- Compter achats ponctuels
    SELECT COUNT(*) INTO v_one_time_count 
    FROM one_time_purchases 
    WHERE user_id = p_user_id AND used = FALSE;
    
    RETURN json_build_object(
        'plan_type', v_quota.plan_type,
        'articles_limit', v_quota.articles_limit,
        'articles_used', v_quota.articles_used,
        'articles_remaining', GREATEST(0, v_quota.articles_limit - v_quota.articles_used),
        'reset_date', v_quota.reset_date,
        'one_time_purchases_available', v_one_time_count,
        'can_generate', (v_quota.articles_limit > v_quota.articles_used) OR (v_one_time_count > 0),
        'has_unlimited', v_quota.articles_limit >= 999999
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 10: TRIGGER AUTO-CRÉATION À L'INSCRIPTION
-- ================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer le profil
    INSERT INTO profiles (user_id, email, first_name)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Créer le quota (FREE = 0 articles)
    INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
    VALUES (NEW.id, 'free', 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ================================================
-- ÉTAPE 11: ROW LEVEL SECURITY (RLS)
-- ================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wordpress_configs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Quotas
CREATE POLICY "Users can view own quota" ON user_quotas FOR SELECT USING (auth.uid() = user_id);

-- Purchases
CREATE POLICY "Users can view own purchases" ON one_time_purchases FOR SELECT USING (auth.uid() = user_id);

-- Articles
CREATE POLICY "Users can view own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own articles" ON articles FOR DELETE USING (auth.uid() = user_id);

-- WordPress configs
CREATE POLICY "Users can manage own wordpress" ON wordpress_configs FOR ALL USING (auth.uid() = user_id);

-- Service role (pour les API backend)
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access quotas" ON user_quotas FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access purchases" ON one_time_purchases FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access articles" ON articles FOR ALL USING (auth.role() = 'service_role');

-- ================================================
-- TERMINÉ !
-- ================================================

SELECT 'Schema SaaS complet créé avec succès!' as status;

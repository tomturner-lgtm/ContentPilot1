-- ================================================
-- BETTER AUTH + CONTENTPILOT - SCHEMA COMPLET
-- Exécuter dans Supabase SQL Editor
-- ================================================

-- ATTENTION: Ce script SUPPRIME toutes les tables existantes
-- Ne l'exécutez que si vous n'avez pas de données importantes !

-- ================================================
-- ÉTAPE 1: SUPPRIMER LES TABLES EXISTANTES
-- ================================================

DROP TABLE IF EXISTS wordpress_configs CASCADE;
DROP TABLE IF EXISTS one_time_purchases CASCADE;
DROP TABLE IF EXISTS user_quotas CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- ================================================
-- ÉTAPE 2: CRÉER LES TABLES BETTER AUTH
-- ================================================

-- Table des utilisateurs (Better Auth)
CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions (Better Auth)
CREATE TABLE session (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Table des comptes/providers (Better Auth)
CREATE TABLE account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de vérification (email, etc.) (Better Auth)
CREATE TABLE verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour Better Auth
CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_session_token ON session(token);
CREATE INDEX idx_account_user_id ON account(user_id);
CREATE INDEX idx_user_email ON "user"(email);

-- ================================================
-- ÉTAPE 3: CRÉER LES TABLES CONTENTPILOT
-- ================================================

-- Table des quotas utilisateurs
CREATE TABLE user_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'free',
    articles_limit INTEGER DEFAULT 1,
    articles_used INTEGER DEFAULT 0,
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des achats ponctuels
CREATE TABLE one_time_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des articles générés
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils (optionnel, pour données supplémentaires)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    email TEXT,
    plan TEXT DEFAULT 'free',
    articles_count INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des configurations WordPress
CREATE TABLE wordpress_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    site_url TEXT,
    username TEXT,
    application_password TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour ContentPilot
CREATE INDEX idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX idx_one_time_purchases_user_id ON one_time_purchases(user_id);
CREATE INDEX idx_articles_user_id ON articles(user_id);

-- ================================================
-- ÉTAPE 4: FONCTION RPC POUR LE QUOTA
-- ================================================

CREATE OR REPLACE FUNCTION get_user_quota(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_quota user_quotas%ROWTYPE;
    v_one_time_count INTEGER;
BEGIN
    -- Récupérer le quota de l'utilisateur
    SELECT * INTO v_quota FROM user_quotas WHERE user_id = p_user_id;
    
    -- Si pas de quota, créer un quota par défaut
    IF v_quota IS NULL THEN
        INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
        VALUES (p_user_id, 'free', 1, 0)
        RETURNING * INTO v_quota;
    END IF;
    
    -- Vérifier si on doit réinitialiser le quota mensuel
    IF v_quota.reset_date < NOW() THEN
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
    
    -- Construire le résultat JSON
    result := json_build_object(
        'plan_type', v_quota.plan_type,
        'articles_limit', v_quota.articles_limit,
        'articles_used', v_quota.articles_used,
        'articles_remaining', GREATEST(0, v_quota.articles_limit - v_quota.articles_used),
        'reset_date', v_quota.reset_date,
        'one_time_purchases_available', v_one_time_count,
        'has_unlimited', v_quota.plan_type = 'unlimited' OR v_quota.articles_limit >= 999999
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ÉTAPE 5: TRIGGER POUR CRÉER LE QUOTA AUTO
-- ================================================

CREATE OR REPLACE FUNCTION create_user_quota_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_quotas (user_id, plan_type, articles_limit, articles_used)
    VALUES (NEW.id, 'free', 1, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON "user";
CREATE TRIGGER on_user_created
    AFTER INSERT ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION create_user_quota_on_signup();

-- ================================================
-- TERMINÉ !
-- ================================================

-- Vérification: afficher les tables créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

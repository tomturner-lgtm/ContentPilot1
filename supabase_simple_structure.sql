-- ==============================================================================
-- CONTENTPILOT - CRÉATION COMPLÈTE DE LA BASE (sans dépendances)
-- ==============================================================================
-- Ce script crée tout depuis zéro, en récupérant les users depuis auth.users
-- ==============================================================================

-- =====================
-- ÉTAPE 1: SUPPRIMER TOUTES LES TABLES (si elles existent)
-- =====================

DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.one_time_purchases CASCADE;
DROP TABLE IF EXISTS public.wordpress_configs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_quotas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Supprimer les backups si existants
DROP TABLE IF EXISTS public._backup_users CASCADE;
DROP TABLE IF EXISTS public._backup_quotas CASCADE;
DROP TABLE IF EXISTS public._backup_articles CASCADE;
DROP TABLE IF EXISTS public._backup_purchases CASCADE;
DROP TABLE IF EXISTS public._backup_wordpress CASCADE;

-- =====================
-- ÉTAPE 2: CRÉER LA TABLE USERS (avec plan intégré)
-- =====================

CREATE TABLE public.users (
    -- Identité
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    website_url TEXT,
    
    -- Préférences
    preferred_language TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Europe/Paris',
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- PLAN & QUOTA (intégré directement)
    plan TEXT DEFAULT 'free',  -- 'free', 'test', 'pro', 'max'
    billing_period TEXT DEFAULT 'monthly',
    articles_limit INTEGER DEFAULT 1,
    articles_used INTEGER DEFAULT 0,
    quota_reset_date TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ÉTAPE 3: CRÉER LES AUTRES TABLES
-- =====================

CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    keyword TEXT,
    content TEXT,
    word_count INTEGER,
    template TEXT,
    language TEXT DEFAULT 'fr',
    target_length INTEGER,
    is_published BOOLEAN DEFAULT false,
    published_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.one_time_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_payment_id TEXT,
    amount_paid INTEGER DEFAULT 500,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.wordpress_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    site_name TEXT,
    site_url TEXT NOT NULL,
    username TEXT NOT NULL,
    application_password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ÉTAPE 4: IMPORTER LES UTILISATEURS EXISTANTS DEPUIS auth.users
-- =====================

INSERT INTO public.users (auth_id, email, first_name, plan, articles_limit, created_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    'free',
    1,
    created_at
FROM auth.users
ON CONFLICT (auth_id) DO NOTHING;

-- =====================
-- ÉTAPE 5: TRIGGER POUR NOUVEAUX USERS
-- =====================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, first_name, plan, articles_limit)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'free',
        1
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================
-- ÉTAPE 6: INDEX
-- =====================

CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_articles_user_id ON public.articles(user_id);
CREATE INDEX idx_purchases_user_id ON public.one_time_purchases(user_id);
CREATE INDEX idx_wordpress_user_id ON public.wordpress_configs(user_id);

-- =====================
-- ÉTAPE 7: RLS (Sécurité)
-- =====================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_configs ENABLE ROW LEVEL SECURITY;

-- Fonction helper
CREATE OR REPLACE FUNCTION public.get_my_user_id() RETURNS UUID AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Policies
DROP POLICY IF EXISTS "Users view own data" ON public.users;
CREATE POLICY "Users view own data" ON public.users FOR SELECT USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "Users update own data" ON public.users;
CREATE POLICY "Users update own data" ON public.users FOR UPDATE USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own articles" ON public.articles;
CREATE POLICY "Users manage own articles" ON public.articles FOR ALL USING (user_id = public.get_my_user_id());

DROP POLICY IF EXISTS "Users view own purchases" ON public.one_time_purchases;
CREATE POLICY "Users view own purchases" ON public.one_time_purchases FOR SELECT USING (user_id = public.get_my_user_id());

DROP POLICY IF EXISTS "Users manage own wp" ON public.wordpress_configs;
CREATE POLICY "Users manage own wp" ON public.wordpress_configs FOR ALL USING (user_id = public.get_my_user_id());

-- =====================
-- VÉRIFICATION
-- =====================

SELECT 
    u.id, 
    u.email, 
    u.first_name, 
    u.plan, 
    u.articles_limit, 
    u.articles_used
FROM public.users u
ORDER BY u.created_at DESC;

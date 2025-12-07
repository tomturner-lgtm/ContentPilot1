-- ==============================================================================
-- CONTENTPILOT - STRUCTURE SIMPLIFIÉE (users avec plan intégré)
-- ==============================================================================
-- Architecture simple : tout sur l'utilisateur dans une seule table
-- ==============================================================================

-- =====================
-- ÉTAPE 1: SAUVEGARDER LES DONNÉES
-- =====================

CREATE TABLE IF NOT EXISTS public._backup_users AS SELECT * FROM public.profiles;
CREATE TABLE IF NOT EXISTS public._backup_quotas AS SELECT * FROM public.user_quotas;
CREATE TABLE IF NOT EXISTS public._backup_articles AS SELECT * FROM public.articles;
CREATE TABLE IF NOT EXISTS public._backup_purchases AS SELECT * FROM public.one_time_purchases;
CREATE TABLE IF NOT EXISTS public._backup_wordpress AS SELECT * FROM public.wordpress_configs;

-- =====================
-- ÉTAPE 2: SUPPRIMER LES ANCIENNES TABLES
-- =====================

DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.one_time_purchases CASCADE;
DROP TABLE IF EXISTS public.wordpress_configs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_quotas CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================
-- ÉTAPE 3: CRÉER LA TABLE USERS COMPLÈTE (avec plan intégré)
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
-- ÉTAPE 4: CRÉER LES AUTRES TABLES (liées à users)
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
-- ÉTAPE 5: MIGRER LES DONNÉES EXISTANTES
-- =====================

-- Insérer les users avec leurs données de profile et quota
INSERT INTO public.users (
    auth_id, email, first_name, last_name, avatar_url, company_name, website_url,
    preferred_language, timezone, onboarding_completed,
    plan, billing_period, articles_limit, articles_used, quota_reset_date,
    stripe_customer_id, stripe_subscription_id, stripe_subscription_status,
    subscription_start_date, subscription_end_date, created_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(p.first_name, split_part(au.email, '@', 1)),
    p.last_name,
    p.avatar_url,
    p.company_name,
    p.website_url,
    COALESCE(p.preferred_language, 'fr'),
    COALESCE(p.timezone, 'Europe/Paris'),
    COALESCE(p.onboarding_completed, false),
    COALESCE(q.plan_type, 'free'),
    COALESCE(q.billing_period, 'monthly'),
    COALESCE(q.articles_limit, 1),
    COALESCE(q.articles_used, 0),
    COALESCE(q.reset_date, date_trunc('month', NOW()) + INTERVAL '1 month'),
    q.stripe_customer_id,
    q.stripe_subscription_id,
    q.stripe_subscription_status,
    q.subscription_start_date,
    q.subscription_end_date,
    au.created_at
FROM auth.users au
LEFT JOIN public._backup_users p ON p.user_id = au.id
LEFT JOIN public._backup_quotas q ON q.user_id = au.id
ON CONFLICT (auth_id) DO NOTHING;

-- Migrer les articles
INSERT INTO public.articles (user_id, title, keyword, content, word_count, template, language, target_length, is_published, published_url, created_at, updated_at)
SELECT 
    u.id,
    a.title,
    a.keyword,
    a.content,
    a.word_count,
    a.template,
    a.language,
    a.target_length,
    a.is_published,
    a.published_url,
    a.created_at,
    a.updated_at
FROM public._backup_articles a
JOIN public.users u ON u.auth_id = a.user_id;

-- Migrer les achats
INSERT INTO public.one_time_purchases (user_id, stripe_payment_id, amount_paid, used, used_at, created_at)
SELECT 
    u.id,
    p.stripe_payment_id,
    p.amount_paid,
    p.used,
    p.used_at,
    p.created_at
FROM public._backup_purchases p
JOIN public.users u ON u.auth_id = p.user_id;

-- Migrer WordPress configs
INSERT INTO public.wordpress_configs (user_id, site_name, site_url, username, application_password, is_verified, last_verified_at, created_at, updated_at)
SELECT 
    u.id,
    w.site_name,
    w.site_url,
    w.username,
    w.application_password,
    w.is_verified,
    w.last_verified_at,
    w.created_at,
    w.updated_at
FROM public._backup_wordpress w
JOIN public.users u ON u.auth_id = w.user_id;

-- =====================
-- ÉTAPE 6: TRIGGER POUR NOUVEAUX USERS
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
-- ÉTAPE 7: INDEX & RLS
-- =====================

CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_plan ON public.users(plan);
CREATE INDEX idx_articles_user_id ON public.articles(user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own data" ON public.users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users update own data" ON public.users FOR UPDATE USING (auth_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_my_user_id() RETURNS UUID AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE POLICY "Users manage own articles" ON public.articles FOR ALL USING (user_id = public.get_my_user_id());
CREATE POLICY "Users view own purchases" ON public.one_time_purchases FOR SELECT USING (user_id = public.get_my_user_id());
CREATE POLICY "Users manage own wp" ON public.wordpress_configs FOR ALL USING (user_id = public.get_my_user_id());

-- =====================
-- ÉTAPE 8: NETTOYAGE
-- =====================

DROP TABLE IF EXISTS public._backup_users;
DROP TABLE IF EXISTS public._backup_quotas;
DROP TABLE IF EXISTS public._backup_articles;
DROP TABLE IF EXISTS public._backup_purchases;
DROP TABLE IF EXISTS public._backup_wordpress;

-- =====================
-- VÉRIFICATION
-- =====================
/*
SELECT id, email, first_name, plan, articles_limit, articles_used, stripe_customer_id
FROM public.users
ORDER BY created_at DESC;
*/

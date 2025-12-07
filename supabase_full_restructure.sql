-- ==============================================================================
-- CONTENTPILOT - RESTRUCTURATION COMPLÈTE DE LA BASE DE DONNÉES
-- ==============================================================================
-- Architecture relationnelle classique avec table users centrale
-- ==============================================================================

-- =====================
-- ÉTAPE 1: CRÉER LA TABLE USERS CENTRALE
-- =====================

-- Sauvegarder les données existantes des profiles dans une table temporaire
CREATE TABLE IF NOT EXISTS public._temp_profiles_backup AS 
SELECT * FROM public.profiles;

-- Créer la table users centrale
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL,  -- Lien vers auth.users pour le login
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    website_url TEXT,
    preferred_language TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Europe/Paris',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ÉTAPE 2: MIGRER LES DONNÉES EXISTANTES
-- =====================

-- Insérer les utilisateurs depuis auth.users + profiles
INSERT INTO public.users (auth_id, email, first_name, last_name, avatar_url, company_name, website_url, preferred_language, timezone, onboarding_completed, created_at)
SELECT 
    au.id AS auth_id,
    au.email,
    COALESCE(p.first_name, split_part(au.email, '@', 1)),
    p.last_name,
    p.avatar_url,
    p.company_name,
    p.website_url,
    COALESCE(p.preferred_language, 'fr'),
    COALESCE(p.timezone, 'Europe/Paris'),
    COALESCE(p.onboarding_completed, false),
    au.created_at
FROM auth.users au
LEFT JOIN public._temp_profiles_backup p ON p.user_id = au.id
ON CONFLICT (auth_id) DO NOTHING;


-- =====================
-- ÉTAPE 3: RECRÉER LES TABLES AVEC LES BONNES RELATIONS
-- =====================

-- Sauvegarder les données existantes
CREATE TABLE IF NOT EXISTS public._temp_user_quotas_backup AS SELECT * FROM public.user_quotas;
CREATE TABLE IF NOT EXISTS public._temp_articles_backup AS SELECT * FROM public.articles;
CREATE TABLE IF NOT EXISTS public._temp_one_time_purchases_backup AS SELECT * FROM public.one_time_purchases;
CREATE TABLE IF NOT EXISTS public._temp_wordpress_configs_backup AS SELECT * FROM public.wordpress_configs;

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_quotas CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.one_time_purchases CASCADE;
DROP TABLE IF EXISTS public.wordpress_configs CASCADE;

-- USER_QUOTAS: Lié à users
CREATE TABLE public.user_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'free',
    billing_period TEXT DEFAULT 'monthly',
    articles_limit INTEGER DEFAULT 1,
    articles_used INTEGER DEFAULT 0,
    reset_date TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_subscription_status TEXT,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ARTICLES: Lié à users
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
    quota_source TEXT DEFAULT 'subscription',
    one_time_purchase_id UUID,
    is_published BOOLEAN DEFAULT false,
    published_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ONE_TIME_PURCHASES: Lié à users
CREATE TABLE public.one_time_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_payment_id TEXT,
    amount_paid INTEGER DEFAULT 500,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORDPRESS_CONFIGS: Lié à users
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

-- Ajouter la FK pour articles -> one_time_purchases
ALTER TABLE public.articles 
ADD CONSTRAINT articles_one_time_purchase_id_fkey 
FOREIGN KEY (one_time_purchase_id) REFERENCES public.one_time_purchases(id) ON DELETE SET NULL;


-- =====================
-- ÉTAPE 4: RESTAURER LES DONNÉES
-- =====================

-- Restaurer user_quotas
INSERT INTO public.user_quotas (user_id, plan_type, billing_period, articles_limit, articles_used, reset_date, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, subscription_start_date, subscription_end_date, created_at, updated_at)
SELECT 
    u.id,
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
    COALESCE(q.created_at, NOW()),
    NOW()
FROM public.users u
LEFT JOIN public._temp_user_quotas_backup q ON q.user_id = u.auth_id
ON CONFLICT (user_id) DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    articles_limit = EXCLUDED.articles_limit,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id;

-- Restaurer articles
INSERT INTO public.articles (user_id, title, keyword, content, word_count, template, language, target_length, quota_source, is_published, published_url, created_at, updated_at)
SELECT 
    u.id,
    a.title,
    a.keyword,
    a.content,
    a.word_count,
    a.template,
    a.language,
    a.target_length,
    a.quota_source,
    a.is_published,
    a.published_url,
    a.created_at,
    a.updated_at
FROM public._temp_articles_backup a
JOIN public.users u ON u.auth_id = a.user_id;

-- Restaurer one_time_purchases
INSERT INTO public.one_time_purchases (user_id, stripe_payment_id, amount_paid, used, used_at, created_at)
SELECT 
    u.id,
    p.stripe_payment_id,
    p.amount_paid,
    p.used,
    p.used_at,
    p.created_at
FROM public._temp_one_time_purchases_backup p
JOIN public.users u ON u.auth_id = p.user_id;

-- Restaurer wordpress_configs
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
FROM public._temp_wordpress_configs_backup w
JOIN public.users u ON u.auth_id = w.user_id;


-- =====================
-- ÉTAPE 5: TRIGGER POUR SYNC AUTH -> USERS
-- =====================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Créer l'utilisateur dans public.users
    INSERT INTO public.users (auth_id, email, first_name, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NOW()
    )
    RETURNING id INTO new_user_id;

    -- Créer automatiquement le quota (plan free)
    INSERT INTO public.user_quotas (user_id, plan_type, articles_limit, articles_used)
    VALUES (new_user_id, 'free', 1, 0);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- =====================
-- ÉTAPE 6: INDEX ET RLS
-- =====================

CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_user_quotas_user_id ON public.user_quotas(user_id);
CREATE INDEX idx_articles_user_id ON public.articles(user_id);
CREATE INDEX idx_one_time_purchases_user_id ON public.one_time_purchases(user_id);
CREATE INDEX idx_wordpress_configs_user_id ON public.wordpress_configs(user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_configs ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour obtenir le user_id public depuis auth.uid()
CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS UUID AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth_id = auth.uid());

CREATE POLICY "Users can view own quota" ON public.user_quotas FOR SELECT USING (user_id = public.get_my_user_id());

CREATE POLICY "Users can view own articles" ON public.articles FOR SELECT USING (user_id = public.get_my_user_id());
CREATE POLICY "Users can insert own articles" ON public.articles FOR INSERT WITH CHECK (user_id = public.get_my_user_id());
CREATE POLICY "Users can update own articles" ON public.articles FOR UPDATE USING (user_id = public.get_my_user_id());
CREATE POLICY "Users can delete own articles" ON public.articles FOR DELETE USING (user_id = public.get_my_user_id());

CREATE POLICY "Users can view own purchases" ON public.one_time_purchases FOR SELECT USING (user_id = public.get_my_user_id());

CREATE POLICY "Users can manage own wp configs" ON public.wordpress_configs FOR ALL USING (user_id = public.get_my_user_id());


-- =====================
-- ÉTAPE 7: NETTOYAGE
-- =====================

DROP TABLE IF EXISTS public._temp_profiles_backup;
DROP TABLE IF EXISTS public._temp_user_quotas_backup;
DROP TABLE IF EXISTS public._temp_articles_backup;
DROP TABLE IF EXISTS public._temp_one_time_purchases_backup;
DROP TABLE IF EXISTS public._temp_wordpress_configs_backup;


-- =====================
-- VÉRIFICATION FINALE
-- =====================
-- Exécutez cette requête pour voir la structure:
/*
SELECT 
    u.id AS user_id,
    u.email,
    u.first_name,
    q.plan_type,
    q.articles_limit,
    q.articles_used,
    (SELECT COUNT(*) FROM public.articles a WHERE a.user_id = u.id) AS total_articles
FROM public.users u
LEFT JOIN public.user_quotas q ON q.user_id = u.id
ORDER BY u.created_at DESC;
*/

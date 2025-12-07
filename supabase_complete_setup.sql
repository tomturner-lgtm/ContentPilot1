-- ==============================================================================
-- CONTENTPILOT - CONFIGURATION COMPLETE DE LA BASE DE DONNÉES
-- ==============================================================================
-- Ce script configure une architecture professionnelle et scalable :
-- 1. Triggers pour créer automatiquement les données utilisateur à l'inscription
-- 2. Remplissage des données manquantes pour les utilisateurs existants
-- 3. Index pour des requêtes performantes
-- 4. Politiques RLS pour la sécurité
-- ==============================================================================

-- =====================
-- PARTIE 1: FONCTIONS DE TRIGGER
-- =====================

-- Fonction qui crée automatiquement un profil et un quota quand un utilisateur s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer le profil utilisateur
    INSERT INTO public.profiles (user_id, email, first_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- Créer le quota utilisateur (plan gratuit par défaut)
    INSERT INTO public.user_quotas (user_id, plan_type, articles_limit, articles_used, reset_date, created_at, updated_at)
    VALUES (
        NEW.id,
        'free',
        1,
        0,
        date_trunc('month', NOW()) + INTERVAL '1 month',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà, puis le recréer
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================
-- PARTIE 2: REMPLISSAGE DES DONNÉES EXISTANTES (BACKFILL)
-- =====================

-- Créer les profils manquants pour tous les utilisateurs existants
INSERT INTO public.profiles (user_id, email, first_name, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id);

-- Créer les quotas manquants pour tous les utilisateurs existants
INSERT INTO public.user_quotas (user_id, plan_type, articles_limit, articles_used, reset_date, created_at, updated_at)
SELECT 
    u.id,
    'free',
    1,
    0,
    date_trunc('month', NOW()) + INTERVAL '1 month',
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_quotas q WHERE q.user_id = u.id);


-- =====================
-- PARTIE 3: INDEX POUR LA PERFORMANCE
-- =====================

-- Index sur user_id pour des JOINs rapides
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON public.user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON public.articles(user_id);
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_user_id ON public.one_time_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_configs_user_id ON public.wordpress_configs(user_id);

-- Index sur le plan_type pour filtrer par type de plan
CREATE INDEX IF NOT EXISTS idx_user_quotas_plan_type ON public.user_quotas(plan_type);


-- =====================
-- PARTIE 4: POLITIQUES RLS (Row Level Security)
-- =====================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_configs ENABLE ROW LEVEL SECURITY;

-- PROFILES: L'utilisateur peut voir et modifier uniquement son propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER_QUOTAS: L'utilisateur peut voir son quota, seul le service peut le modifier
DROP POLICY IF EXISTS "Users can view own quota" ON public.user_quotas;
CREATE POLICY "Users can view own quota" ON public.user_quotas
    FOR SELECT USING (auth.uid() = user_id);

-- ARTICLES: L'utilisateur peut gérer ses propres articles
DROP POLICY IF EXISTS "Users can view own articles" ON public.articles;
CREATE POLICY "Users can view own articles" ON public.articles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own articles" ON public.articles;
CREATE POLICY "Users can insert own articles" ON public.articles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own articles" ON public.articles;
CREATE POLICY "Users can update own articles" ON public.articles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own articles" ON public.articles;
CREATE POLICY "Users can delete own articles" ON public.articles
    FOR DELETE USING (auth.uid() = user_id);

-- ONE_TIME_PURCHASES: L'utilisateur peut voir ses achats
DROP POLICY IF EXISTS "Users can view own purchases" ON public.one_time_purchases;
CREATE POLICY "Users can view own purchases" ON public.one_time_purchases
    FOR SELECT USING (auth.uid() = user_id);

-- WORDPRESS_CONFIGS: L'utilisateur peut gérer ses configurations WordPress
DROP POLICY IF EXISTS "Users can view own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can view own wp configs" ON public.wordpress_configs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can insert own wp configs" ON public.wordpress_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can update own wp configs" ON public.wordpress_configs
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wp configs" ON public.wordpress_configs;
CREATE POLICY "Users can delete own wp configs" ON public.wordpress_configs
    FOR DELETE USING (auth.uid() = user_id);


-- =====================
-- PARTIE 5: VÉRIFICATION
-- =====================
-- Exécutez cette requête après le script pour vérifier que tout est lié:
/*
SELECT 
    u.id AS auth_user_id, 
    u.email,
    p.id AS profile_id,
    p.first_name,
    q.id AS quota_id,
    q.plan_type,
    q.articles_limit
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_quotas q ON q.user_id = u.id
ORDER BY u.created_at DESC;
*/

-- FIN DU SCRIPT

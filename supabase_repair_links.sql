-- ==============================================================================
-- SCRIPT DE RÉPARATION DES LIENS ET DONNÉES (Fix Relations & Backfill)
-- ==============================================================================
-- Ce script va :
-- 1. S'assurer que toutes les Foreign Keys vers auth.users existent.
-- 2. Créer les lignes manquantes dans user_quotas pour les utilisateurs existants.
-- 3. Créer les lignes manquantes dans profiles pour les utilisateurs existants.
-- ==============================================================================

-- 1. VÉRIFICATION ET CRÉATION DES FOREIGN KEYS (Idempotent)
DO $$
BEGIN
    -- Lien: articles -> auth.users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_user_id_fkey') THEN
        ALTER TABLE public.articles 
        ADD CONSTRAINT articles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Lien: one_time_purchases -> auth.users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'one_time_purchases_user_id_fkey') THEN
        ALTER TABLE public.one_time_purchases 
        ADD CONSTRAINT one_time_purchases_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Lien: profiles -> auth.users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_fkey') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Lien: user_quotas -> auth.users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_quotas_user_id_fkey') THEN
        ALTER TABLE public.user_quotas 
        ADD CONSTRAINT user_quotas_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Lien: wordpress_configs -> auth.users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wordpress_configs_user_id_fkey') THEN
        ALTER TABLE public.wordpress_configs 
        ADD CONSTRAINT wordpress_configs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. BACKFILL (REMPLISSAGE) DES DONNÉES MANQUANTES
-- Pour chaque utilisateur dans auth.users qui n'a pas de plan dans user_quotas, on en crée un par défaut.
INSERT INTO public.user_quotas (user_id, plan_type, articles_limit, articles_used, reset_date)
SELECT 
    id, 
    'free', 
    1, 
    0, 
    (date_trunc('month', now()) + interval '1 month')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_quotas);

-- Pour chaque utilisateur qui n'a pas de profil, on en crée un.
INSERT INTO public.profiles (user_id, email, first_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', substring(email from '(.*)@')),
    now(),
    now()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);

-- 3. CONFIRMATION
-- Vous pouvez exécuter cette requête pour vérifier les résultats :
-- SELECT 
--    u.id as user_id, 
--    u.email, 
--    p.id as profile_id, 
--    q.plan_type 
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.user_id = u.id
-- LEFT JOIN public.user_quotas q ON q.user_id = u.id;

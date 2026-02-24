-- 1. DÉBLOCAGE : Confirmer manuellement tous les utilisateurs (pour régler votre problème de connexion)
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- 2. CRÉATION DES TABLES

-- Table: couples (Les infos partagées du couple)
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT,
    meet_date DATE,
    official_date DATE,
    meet_place TEXT,
    quote TEXT,
    song TEXT,
    pin_code TEXT
);

-- Table: profiles (Lie les utilisateurs au Couple)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    full_name TEXT,
    color TEXT DEFAULT '#e17055',
    avatar_url TEXT,
    nickname TEXT,
    bio TEXT,
    username TEXT UNIQUE,
    email TEXT
);

-- Table: events (Calendrier)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    title TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT DEFAULT 'event',
    description TEXT
);

-- Table: photos (Galerie)
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Table: messages (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    sender_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL
);

-- Table: todos (Tâches)
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    text TEXT NOT NULL,
    category TEXT DEFAULT 'Maison',
    done BOOLEAN DEFAULT false
);

-- Table: meals (Idées Repas)
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    name TEXT NOT NULL
);

-- Table: journal_entries (Journal Intime)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    text TEXT NOT NULL,
    mood TEXT DEFAULT 'neutral',
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: surprises (Surprises)
CREATE TABLE IF NOT EXISTS public.surprises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    title TEXT NOT NULL,
    message TEXT,
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table: timeline_events (Frise Chronologique)
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    couple_id UUID REFERENCES public.couples(id),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    emotion TEXT DEFAULT 'heart',
    description TEXT
);

-- 3. SÉCURITÉ (RLS)
-- On active la sécurité mais on autorise tout aux utilisateurs connectés pour le moment
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès (Tout le monde connecté peut tout voir/modifier pour l'instant)
-- On supprime d'abord les politiques existantes pour éviter les erreurs de doublons
DROP POLICY IF EXISTS "Accès complet couples" ON public.couples;
CREATE POLICY "Accès complet couples" ON public.couples FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet profiles" ON public.profiles;
CREATE POLICY "Accès complet profiles" ON public.profiles FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet events" ON public.events;
CREATE POLICY "Accès complet events" ON public.events FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet photos" ON public.photos;
CREATE POLICY "Accès complet photos" ON public.photos FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet messages" ON public.messages;
CREATE POLICY "Accès complet messages" ON public.messages FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet todos" ON public.todos;
CREATE POLICY "Accès complet todos" ON public.todos FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet meals" ON public.meals;
CREATE POLICY "Accès complet meals" ON public.meals FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet journal" ON public.journal_entries;
CREATE POLICY "Accès complet journal" ON public.journal_entries FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet surprises" ON public.surprises;
CREATE POLICY "Accès complet surprises" ON public.surprises FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Accès complet timeline" ON public.timeline_events;
CREATE POLICY "Accès complet timeline" ON public.timeline_events FOR ALL TO authenticated USING (true);

-- 4. STORAGE (Pour les images)
-- Création du bucket 'images' s'il n'existe pas (nécessite l'extension storage)
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;

-- Politiques Storage
DROP POLICY IF EXISTS "Lecture publique images" ON storage.objects;
CREATE POLICY "Lecture publique images" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Upload images authentifié" ON storage.objects;
CREATE POLICY "Upload images authentifié" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'images' );

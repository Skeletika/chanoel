-- Création de la table pour les abonnements Push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Évite les doublons exacts pour un même user
    UNIQUE(user_id, subscription)
);

-- Sécurité (Row Level Security)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent ajouter leur propre abonnement
CREATE POLICY "Users can insert their own subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre abonnement
CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Le serveur (Service Role) a tout pouvoir (Lecture/Suppression pour nettoyage)
GRANT ALL ON TABLE public.push_subscriptions TO service_role;
GRANT ALL ON TABLE public.push_subscriptions TO postgres;
GRANT SELECT, INSERT, DELETE ON TABLE public.push_subscriptions TO authenticated;

-- Force le rafraîchissement du cache de l'API Supabase
NOTIFY pgrst, 'reload';

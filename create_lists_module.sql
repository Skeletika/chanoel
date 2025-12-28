-- Table principale : Les Listes (Conteneurs)
CREATE TABLE IF NOT EXISTS public.lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    icon TEXT DEFAULT 'List', -- Nom de l'icône Lucide ou Emoji
    color TEXT DEFAULT '#0984e3', -- Couleur hexadécimale
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table secondaire : Les Éléments de liste
CREATE TABLE IF NOT EXISTS public.list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_checked BOOLEAN DEFAULT FALSE,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Qui a ajouté l'item
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sécurité (RLS)
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Policies pour LISTS
CREATE POLICY "Couples can view their own lists"
ON public.lists FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE couple_id = public.lists.couple_id
));

CREATE POLICY "Couples can insert their own lists"
ON public.lists FOR INSERT
WITH CHECK (auth.uid() IN (
    SELECT id FROM public.profiles WHERE couple_id = public.lists.couple_id
));

CREATE POLICY "Couples can update their own lists"
ON public.lists FOR UPDATE
USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE couple_id = public.lists.couple_id
));

CREATE POLICY "Couples can delete their own lists"
ON public.lists FOR DELETE
USING (auth.uid() IN (
    SELECT id FROM public.profiles WHERE couple_id = public.lists.couple_id
));

-- Policies pour LIST_ITEMS
-- On vérifie via la table parente 'lists'
CREATE POLICY "Couples can view items in their lists"
ON public.list_items FOR SELECT
USING (exists(
    select 1 from public.lists
    where public.lists.id = public.list_items.list_id
    and auth.uid() in (select id from public.profiles where couple_id = public.lists.couple_id)
));

CREATE POLICY "Couples can insert items to their lists"
ON public.list_items FOR INSERT
WITH CHECK (
    -- On doit vérifier que la liste appartient au couple de l'user
    exists(
        select 1 from public.lists
        where public.lists.id = public.list_items.list_id
        and auth.uid() in (select id from public.profiles where couple_id = public.lists.couple_id)
    )
);

CREATE POLICY "Couples can update items in their lists"
ON public.list_items FOR UPDATE
USING (exists(
    select 1 from public.lists
    where public.lists.id = public.list_items.list_id
    and auth.uid() in (select id from public.profiles where couple_id = public.lists.couple_id)
));

CREATE POLICY "Couples can delete items in their lists"
ON public.list_items FOR DELETE
USING (exists(
    select 1 from public.lists
    where public.lists.id = public.list_items.list_id
    and auth.uid() in (select id from public.profiles where couple_id = public.lists.couple_id)
));

-- Permissions
GRANT ALL ON TABLE public.lists TO authenticated;
GRANT ALL ON TABLE public.list_items TO authenticated;
GRANT ALL ON TABLE public.lists TO service_role;
GRANT ALL ON TABLE public.list_items TO service_role;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_items;

NOTIFY pgrst, 'reload';

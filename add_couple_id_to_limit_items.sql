-- Ajout de la colonne couple_id à list_items pour simplifier le Realtime et les RLS
ALTER TABLE public.list_items ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE;

-- Backfill : On remplit les couple_id manquants en regardant la table parente 'lists'
UPDATE public.list_items
SET couple_id = public.lists.couple_id
FROM public.lists
WHERE public.list_items.list_id = public.lists.id
AND public.list_items.couple_id IS NULL;

-- On rend la colonne obligatoire après le backfill
ALTER TABLE public.list_items ALTER COLUMN couple_id SET NOT NULL;

-- Optimisation des Policies pour utiliser directement couple_id (plus rapide et compatible Realtime)
DROP POLICY IF EXISTS "Couples can view items in their lists" ON public.list_items;
CREATE POLICY "Couples can view items in their lists"
ON public.list_items FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE couple_id = public.list_items.couple_id));

DROP POLICY IF EXISTS "Couples can insert items to their lists" ON public.list_items;
CREATE POLICY "Couples can insert items to their lists"
ON public.list_items FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE couple_id = public.list_items.couple_id));

DROP POLICY IF EXISTS "Couples can update items in their lists" ON public.list_items;
CREATE POLICY "Couples can update items in their lists"
ON public.list_items FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE couple_id = public.list_items.couple_id));

DROP POLICY IF EXISTS "Couples can delete items in their lists" ON public.list_items;
CREATE POLICY "Couples can delete items in their lists"
ON public.list_items FOR DELETE
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE couple_id = public.list_items.couple_id));

NOTIFY pgrst, 'reload';

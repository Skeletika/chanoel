-- Script pour ajouter ON DELETE CASCADE aux clés étrangères référençant la table couples
-- Cela permet de supprimer automatiquement les données liées (événements, messages, etc.) lorsqu'un couple est supprimé.

-- 1. Events
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_couple_id_fkey;
ALTER TABLE public.events ADD CONSTRAINT events_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- 2. Photos
ALTER TABLE public.photos DROP CONSTRAINT IF EXISTS photos_couple_id_fkey;
ALTER TABLE public.photos ADD CONSTRAINT photos_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- 3. Messages
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_couple_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- 4. Todos
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_couple_id_fkey;
ALTER TABLE public.todos ADD CONSTRAINT todos_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- 5. Meals
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_couple_id_fkey;
ALTER TABLE public.meals ADD CONSTRAINT meals_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- 6. Journal Entries
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_couple_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- 7. Surprises
ALTER TABLE public.surprises DROP CONSTRAINT IF EXISTS surprises_couple_id_fkey;
ALTER TABLE public.surprises ADD CONSTRAINT surprises_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

-- 8. Timeline Events
ALTER TABLE public.timeline_events DROP CONSTRAINT IF EXISTS timeline_events_couple_id_fkey;
ALTER TABLE public.timeline_events ADD CONSTRAINT timeline_events_couple_id_fkey 
    FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE;

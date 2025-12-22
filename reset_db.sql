-- ⚠️ ATTENTION : CE SCRIPT EFFACE ABSOLUMENT TOUT ! ⚠️
-- À exécuter dans l'éditeur SQL de Supabase pour repartir de zéro.

-- 1. Vider toutes les tables de données (L'ordre est important ou on utilise CASCADE)
TRUNCATE TABLE public.messages CASCADE;
TRUNCATE TABLE public.photos CASCADE;
TRUNCATE TABLE public.events CASCADE;
TRUNCATE TABLE public.todos CASCADE;
TRUNCATE TABLE public.meals CASCADE;
TRUNCATE TABLE public.journal_entries CASCADE;
TRUNCATE TABLE public.surprises CASCADE;
TRUNCATE TABLE public.timeline_events CASCADE;

-- On vide les profils et les couples en dernier (car les autres en dépendent)
TRUNCATE TABLE public.profiles CASCADE;
TRUNCATE TABLE public.couples CASCADE;

-- 2. Supprimer tous les utilisateurs (Authentification)
-- Cela permet de recréer les comptes avec les mêmes emails sans conflit
DELETE FROM auth.users;

-- 3. Vider le stockage (Images)
-- Cela supprime les références aux fichiers. Les fichiers eux-mêmes peuvent rester un moment sur le serveur mais ne seront plus accessibles.
DELETE FROM storage.objects WHERE bucket_id = 'images';

-- Confirmation
SELECT 'Site remis à zéro avec succès' as status;

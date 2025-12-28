-- Active la diffusion en temps réel (Realtime) pour les nouvelles tables
-- Cela permet aux modifications d'apparaître instantanément chez le partenaire

begin;
  -- Supprime d'abord de la publication au cas où pour éviter les erreurs de doublons
  alert publication supabase_realtime drop table if exists public.lists;
  alert publication supabase_realtime drop table if exists public.list_items;
commit;

-- Ajoute les tables à la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_items;

-- Vérifie (pour le log) que c'est bien activé
select * from pg_publication_tables where pubname = 'supabase_realtime';

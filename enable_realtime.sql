-- Activer la publication Realtime pour la table messages
-- Cela permet au client React de recevoir les nouveaux messages instantanément sans recharger.

-- 1. Vérifier si la publication existe (Supabase la crée par défaut), sinon la créer
-- (Généralement 'supabase_realtime' existe déjà)

-- 2. Ajouter la table messages à la publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Optionnel : Ajouter d'autres tables si besoin de temps réel
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

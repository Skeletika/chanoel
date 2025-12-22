-- Ajout de la colonne pour sauvegarder la disposition du dashboard
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN public.couples.dashboard_layout IS 'Stocke la configuration de la grille du dashboard (positions des widgets)';

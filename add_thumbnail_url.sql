-- Ajouter la colonne thumb_url pour les thumbnails compressés
ALTER TABLE photos ADD COLUMN thumb_url TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_photos_couple_id ON photos(couple_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

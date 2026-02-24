-- Migration: Ajouter permission d'upload illimité pour les couples
ALTER TABLE couples ADD COLUMN unlimited_photos BOOLEAN DEFAULT FALSE;

-- Créer un index pour les requêtes futures
CREATE INDEX IF NOT EXISTS idx_couples_unlimited ON couples(unlimited_photos);

-- Commentaires pour documentation
-- unlimited_photos = TRUE : Ce couple peut uploader illimité de photos
-- unlimited_photos = FALSE : Le couple est limité à 25 photos (défaut)

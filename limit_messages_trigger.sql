-- Fonction pour limiter le nombre de messages à 300 par couple
CREATE OR REPLACE FUNCTION maintain_message_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprime les messages les plus anciens si le total dépasse 300 pour ce couple
  -- La logique : On garde les 300 plus récents (ORDER BY created_at DESC OFFSET 300)
  -- Et on supprime tout ce qui n'est pas dans cette liste (donc les plus vieux)
  DELETE FROM messages
  WHERE id IN (
    SELECT id
    FROM messages
    WHERE couple_id = NEW.couple_id
    ORDER BY created_at DESC
    OFFSET 300
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui se déclenche APRÈS chaque insertion d'un nouveau message
DROP TRIGGER IF EXISTS trigger_maintain_message_limit ON messages;
CREATE TRIGGER trigger_maintain_message_limit
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION maintain_message_limit();

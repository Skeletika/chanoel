-- Force add notes table to supabase_realtime publication
BEGIN;

-- 1. Ensure the publication exists (it usually does by default)
-- If it doesn't, we create it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    END IF;
END
$$;

-- 2. Add notes table to the publication
-- This is often the missing step if "ALL TABLES" wasn't used or if the table is new and not auto-added.
ALTER PUBLICATION supabase_realtime ADD TABLE notes;

-- 3. Ensure Replica Identity is FULL (allows receiving old values on delete/update)
ALTER TABLE notes REPLICA IDENTITY FULL;

COMMIT;

-- Add user_id column to tables if it doesn't exist to track who created the item
-- This allows personalized attribution (avatar display)

DO $$ 
BEGIN 
    -- 1. Timeline Events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timeline_events' AND column_name = 'user_id') THEN
        ALTER TABLE timeline_events ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- 2. Journal Entries
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journal_entries' AND column_name = 'user_id') THEN
        ALTER TABLE journal_entries ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- 3. Todos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'user_id') THEN
        ALTER TABLE todos ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- 4. Surprises
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'surprises' AND column_name = 'user_id') THEN
        ALTER TABLE surprises ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- 5. Events (Calendar)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'user_id') THEN
        ALTER TABLE events ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- 6. Meals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meals' AND column_name = 'user_id') THEN
        ALTER TABLE meals ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

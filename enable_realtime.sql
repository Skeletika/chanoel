-- Enable realtime for all relevant tables
-- This ensures that 'postgres_changes' events are sent to the client

-- 1. Photos (Gallery)
alter table photos replica identity full;

-- 2. Todos
alter table todos replica identity full;

-- 3. Events (Calendar)
alter table events replica identity full;

-- 4. Meals
alter table meals replica identity full;

-- 5. Journal Entries
alter table journal_entries replica identity full;

-- 6. Surprises
alter table surprises replica identity full;

-- 7. Messages (Chat) - Already likely enabled but good to ensure
alter table messages replica identity full;

-- Add all tables to the supabase_realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    photos, 
    todos, 
    events, 
    meals, 
    journal_entries, 
    surprises, 
    messages,
    profiles;
commit;

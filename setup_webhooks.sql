-- Enable the pg_net extension if not enabled (Required for Webhooks if using pg_net, 
-- BUT Supabase Dashboard Webhooks are easier. This script assumes we use the internal 'http_request' or simpler triggering).

-- OPTION 1: Using Supabase "Database Webhooks" (Recommended via Dashboard)
-- Since I cannot click on your Dashboard, I will provide the SQL equivalent if your project supports the 'supabase_functions' schema or triggers.

-- Actually, the standard way via SQL is creating a trigger that calls an edge function.
-- Supabase exposes `net.http_post` via `pg_net`.

create extension if not exists pg_net;

-- Create a function that calls the Edge Function
create or replace function public.handle_new_record()
returns trigger as $$
declare
    project_url text := 'https://xojiownwhmichyqmozol.supabase.co';
    function_name text := 'push-sender';
    -- Using the Key found in .env (or you can use Service Role Key if you have it for more permissions)
    anon_key text := 'sb_publishable_DOxrXTwRAip8ILLVDFX88Q_jlW3VY9M'; 
    payload jsonb;
begin
    payload = jsonb_build_object(
        'record', row_to_json(NEW),
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA
    );

    perform
        net.http_post(
            url := project_url || '/functions/v1/' || function_name,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || anon_key
            ),
            body := payload
        );

    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for MESSAGES
DROP TRIGGER IF EXISTS on_messsage_created_push ON public.messages;
CREATE TRIGGER on_messsage_created_push
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_record();

-- Trigger for NOTES
DROP TRIGGER IF EXISTS on_note_created_push ON public.notes;
CREATE TRIGGER on_note_created_push
AFTER INSERT ON public.notes
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_record();

-- Trigger for CALENDAR
DROP TRIGGER IF EXISTS on_event_created_push ON public.events;
CREATE TRIGGER on_event_created_push
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_record();

-- Trigger for TASKS (Todos)
DROP TRIGGER IF EXISTS on_todo_created_push ON public.todos;
CREATE TRIGGER on_todo_created_push
AFTER INSERT ON public.todos
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_record();

-- Trigger for TIMELINE
DROP TRIGGER IF EXISTS on_timeline_created_push ON public.timeline_events;
CREATE TRIGGER on_timeline_created_push
AFTER INSERT ON public.timeline_events
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_record();

-- Trigger for SURPRISES
DROP TRIGGER IF EXISTS on_surprise_created_push ON public.surprises;
CREATE TRIGGER on_surprise_created_push
AFTER INSERT ON public.surprises
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_record();

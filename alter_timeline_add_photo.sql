-- Add image_url column to timeline_events table
ALTER TABLE timeline_events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- (Optional) Update existing policies if necessary, but usually standard policies cover new columns if * is used.

-- Reset (Clean slate)
DROP TABLE IF EXISTS notes CASCADE;

-- Create notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    color TEXT DEFAULT 'yellow', -- 'yellow', 'pink', 'blue', 'green', 'purple'
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policies (Based on profiles table, as couples table doesn't store user IDs directly)

CREATE POLICY "Users can view notes from their couple" ON notes
    FOR SELECT USING (
        (SELECT couple_id FROM profiles WHERE id = auth.uid()) = couple_id
    );

CREATE POLICY "Users can insert notes for their couple" ON notes
    FOR INSERT WITH CHECK (
        (SELECT couple_id FROM profiles WHERE id = auth.uid()) = couple_id
    );

CREATE POLICY "Users can update notes for their couple" ON notes
    FOR UPDATE USING (
        (SELECT couple_id FROM profiles WHERE id = auth.uid()) = couple_id
    );

CREATE POLICY "Users can delete notes from their couple" ON notes
    FOR DELETE USING (
        (SELECT couple_id FROM profiles WHERE id = auth.uid()) = couple_id
    );

-- Enable Realtime
ALTER TABLE notes REPLICA IDENTITY FULL;
-- Note: Manually add 'notes' to publication in Supabase Dashboard if needed

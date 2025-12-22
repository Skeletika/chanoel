-- Add theme_config column to couples table
-- This will store custom color preferences for each couple

ALTER TABLE couples
ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{
  "bg": "#1a1a1a",
  "surface": "#2a2a2a",
  "text": "#ffffff",
  "textMuted": "#a0a0a0",
  "primary": "#ff6b6b",
  "accent": "#ff6b6b",
  "border": "#3a3a3a"
}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN couples.theme_config IS 'Custom theme colors for the couple dashboard (bg, surface, text, textMuted, primary, accent, border)';

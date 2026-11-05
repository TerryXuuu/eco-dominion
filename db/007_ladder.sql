-- Separate the ladder queue from casual. Existing rating rows stay and become the ladder score.
BEGIN;
ALTER TABLE queue_entry ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'casual' CHECK (mode IN ('casual','ranked'));
UPDATE season SET name = 'Ladder' WHERE id = '00000000-0000-4000-8000-000000000001';
UPDATE app_user SET handle = 'robot'
 WHERE id = '00000000-0000-4000-8000-0000000000c0' AND lower(handle) = 'grove'
   AND NOT EXISTS (SELECT 1 FROM app_user other WHERE lower(other.handle) = 'robot' AND other.id <> '00000000-0000-4000-8000-0000000000c0');
UPDATE profile SET display_name = 'Robot', bio = 'Practice opponent. This seat is unrated.'
 WHERE user_id = '00000000-0000-4000-8000-0000000000c0';
COMMIT;

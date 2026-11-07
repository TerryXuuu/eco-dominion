-- Friend presence and which parts of a home page friends are allowed to see.
BEGIN;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS last_seen timestamptz;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS hide_record boolean NOT NULL DEFAULT false;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS hide_achievements boolean NOT NULL DEFAULT false;
COMMIT;

-- A finished match releases its private room. Started rooms stay occupied only while the match is active.
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'room'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE room DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;
ALTER TABLE room ADD CONSTRAINT room_status_check CHECK (status IN ('open', 'started', 'finished', 'cancelled'));
UPDATE room AS r
SET status = 'finished'
FROM match AS m
WHERE r.match_id = m.id
  AND r.status = 'started'
  AND m.status = 'finished';

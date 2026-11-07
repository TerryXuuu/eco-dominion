-- Ladder score moves on ranked matches only. Level points stay on peak_xp.
BEGIN;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS ladder_score integer NOT NULL DEFAULT 0;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS ladder_peak integer NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS ladder_change (
  match_id uuid REFERENCES match(id),
  user_id uuid REFERENCES app_user(id),
  before_value integer NOT NULL,
  after_value integer NOT NULL,
  PRIMARY KEY (match_id, user_id)
);

DO $$
DECLARE
  rec record;
  sc integer;
  pk integer;
  floor_at integer;
BEGIN
  FOR rec IN
    SELECT me.user_id, me.seat, r.winner_seat
    FROM match m
    JOIN match_result r ON r.match_id = m.id
    JOIN match_player me ON me.match_id = m.id
    WHERE m.status = 'finished' AND m.mode = 'ranked'
    ORDER BY m.finished_at, m.id, me.seat
  LOOP
    SELECT ladder_score, ladder_peak INTO sc, pk FROM profile WHERE user_id = rec.user_id;
    IF rec.winner_seat IS NULL THEN
      CONTINUE;
    ELSIF rec.winner_seat = rec.seat THEN
      sc := sc + 30;
      pk := GREATEST(pk, sc);
    ELSIF pk >= 300 THEN
      floor_at := CASE
        WHEN pk >= 1000 THEN 1000
        WHEN pk >= 800 THEN 800
        WHEN pk >= 600 THEN 600
        ELSE 300
      END;
      sc := GREATEST(floor_at, sc - 20);
    END IF;
    UPDATE profile SET ladder_score = sc, ladder_peak = pk WHERE user_id = rec.user_id;
  END LOOP;
END $$;
COMMIT;

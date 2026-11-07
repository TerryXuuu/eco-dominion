-- Highest experience reached. Later matches only add, so a rank never falls.
BEGIN;
ALTER TABLE profile ADD COLUMN IF NOT EXISTS peak_xp integer NOT NULL DEFAULT 0;

UPDATE profile AS p
SET peak_xp = GREATEST(p.peak_xp, COALESCE(earned.xp, 0))
FROM (
  SELECT me.user_id,
         SUM(
           CASE
             WHEN m.mode = 'ranked' AND r.winner_seat = me.seat THEN 40
             WHEN m.mode = 'ranked' AND r.winner_seat IS NULL THEN 25
             WHEN m.mode = 'ranked' THEN 15
             WHEN m.mode = 'casual' AND r.winner_seat = me.seat THEN 25
             WHEN m.mode = 'casual' AND r.winner_seat IS NULL THEN 15
             WHEN m.mode = 'casual' THEN 10
             ELSE 0
           END
         )::int AS xp
  FROM match_player me
  JOIN match m ON m.id = me.match_id AND m.status = 'finished'
  JOIN match_result r ON r.match_id = m.id
  GROUP BY me.user_id
) AS earned
WHERE p.user_id = earned.user_id;
COMMIT;

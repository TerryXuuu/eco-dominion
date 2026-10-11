-- API transaction contract, positional parameters supplied by a server-side driver.
-- The complete driver and projection publishing are implemented in S02.
BEGIN;
SELECT version, private_snapshot FROM match WHERE id=$1 FOR UPDATE;
-- While holding this lock: verify authenticated membership, lifecycle, expected_version.
-- Check match_command by match_id/seat/command_id first; same request_hash returns stored
-- receipt, different hash is a conflict. Run engine only when not already accepted.
-- On a new accepted command, insert snapshot+command+outbox in this same transaction.
UPDATE match SET version=$2, private_snapshot=$3 WHERE id=$1 AND version=$4;
INSERT INTO match_command(match_id,seat,command_id,request_hash,expected_version,accepted_version,payload_private,receipt_private)
 VALUES($1,$5,$6,$7,$4,$2,$8,$9);
INSERT INTO outbox(id,match_id,version,event_type,payload_private) VALUES($10,$1,$2,'match_changed',$11);
COMMIT;
-- Server sends per-seat projections only after commit. The publisher is at-least-once;
-- clients deduplicate version and resync by authenticated snapshot endpoint.

-- S02 play migration: private rooms, casual queue and the casual rating season.
BEGIN;
CREATE TABLE room (
 id uuid PRIMARY KEY,
 code text UNIQUE NOT NULL CHECK (code ~ '^[A-Z2-9]{6}$'),
 host_id uuid NOT NULL REFERENCES app_user(id),
 guest_id uuid REFERENCES app_user(id),
 status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','started','cancelled')),
 match_id uuid UNIQUE REFERENCES match(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (guest_id IS NULL OR guest_id <> host_id)
);
CREATE UNIQUE INDEX room_one_open_per_host ON room(host_id) WHERE status = 'open';
CREATE TABLE queue_entry (
 user_id uuid PRIMARY KEY REFERENCES app_user(id),
 status text NOT NULL CHECK (status IN ('waiting','matched')),
 match_id uuid REFERENCES match(id),
 enqueued_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((status = 'matched') = (match_id IS NOT NULL))
);
CREATE INDEX queue_waiting ON queue_entry(enqueued_at) WHERE status = 'waiting';
CREATE INDEX match_player_user ON match_player(user_id);
CREATE INDEX match_command_replay ON match_command(match_id, accepted_version);
INSERT INTO season (id, name, start_at, end_at)
 VALUES ('00000000-0000-4000-8000-000000000001', 'Casual rating', '2026-01-01T00:00:00Z', '2100-01-01T00:00:00Z')
 ON CONFLICT (id) DO NOTHING;
COMMIT;

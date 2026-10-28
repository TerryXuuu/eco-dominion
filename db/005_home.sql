-- Personal home, avatars, guest role, and the editable footer.

ALTER TABLE user_role DROP CONSTRAINT IF EXISTS user_role_role_check;
ALTER TABLE user_role ADD CONSTRAINT user_role_role_check CHECK (role IN ('player', 'moderator', 'admin', 'guest'));

CREATE TABLE IF NOT EXISTS profile_avatar (
  user_id uuid PRIMARY KEY REFERENCES app_user(id),
  mime text NOT NULL,
  bytes bytea NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_setting (
  key text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO site_setting (key, value) VALUES
  ('copyright', '© Eco Dominion. All rights reserved.'),
  ('contacts', 'Terry & Lynx')
ON CONFLICT (key) DO NOTHING;

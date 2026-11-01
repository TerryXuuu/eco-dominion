-- Community posts can carry tags and a few images. Existing rows stay valid.
BEGIN;
ALTER TABLE post ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
CREATE TABLE post_image (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  mime text NOT NULL,
  bytes bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX post_image_post ON post_image(post_id, created_at);
COMMIT;

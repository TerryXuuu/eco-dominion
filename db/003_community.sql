-- S03 community: report resolution, moderation subjects and the indexes the feed, notifications and checks read.
BEGIN;
ALTER TABLE report ADD COLUMN resolved_by uuid REFERENCES app_user(id);
ALTER TABLE report ADD COLUMN resolved_at timestamptz;
ALTER TABLE report ADD COLUMN resolution text;
ALTER TABLE moderation_action ADD COLUMN subject_type text;
ALTER TABLE moderation_action ADD COLUMN subject_id text;
CREATE UNIQUE INDEX report_open_once ON report(reporter_id, subject_type, subject_id) WHERE status IN ('open','reviewing');
CREATE INDEX report_queue ON report(status, created_at);
CREATE INDEX post_feed ON post(created_at DESC, id DESC);
CREATE INDEX post_author ON post(author_id, created_at DESC);
CREATE INDEX comment_post ON comment(post_id, created_at, id);
CREATE INDEX notification_inbox ON notification(user_id, created_at DESC, id DESC);
CREATE INDEX audit_rate ON audit_log(actor_id, action, created_at);
CREATE INDEX block_blocked ON user_block(blocked);
CREATE INDEX follow_followed ON user_follow(followed);
CREATE INDEX friend_recipient ON friend_request(recipient, status);
COMMIT;

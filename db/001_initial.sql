-- Neon PostgreSQL design migration; apply and validate in S01.
BEGIN;
CREATE TABLE app_user (
 id uuid PRIMARY KEY, auth_subject text UNIQUE NOT NULL, email text NOT NULL, handle text NOT NULL,
 email_verified_at timestamptz,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deleted')),
 created_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE UNIQUE INDEX user_email_ci ON app_user(lower(email));
CREATE UNIQUE INDEX user_handle_ci ON app_user(lower(handle));
CREATE TABLE profile (user_id uuid PRIMARY KEY REFERENCES app_user(id),display_name text NOT NULL,bio text NOT NULL DEFAULT '',avatar_key text,locale text NOT NULL DEFAULT 'zh-CN',visibility text NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','friends','private')));
CREATE TABLE user_role (user_id uuid REFERENCES app_user(id),role text CHECK(role IN ('player','moderator','admin')),PRIMARY KEY(user_id,role));
CREATE TABLE ruleset (id text PRIMARY KEY,content_hash text UNIQUE NOT NULL,catalog jsonb NOT NULL,digital_rules jsonb NOT NULL,approved_at timestamptz,published_at timestamptz);
CREATE TABLE match (id uuid PRIMARY KEY,ruleset_id text NOT NULL REFERENCES ruleset(id),status text NOT NULL CHECK(status IN ('waiting','active','finished','cancelled')),mode text NOT NULL CHECK(mode IN ('casual','ranked','private')),version bigint NOT NULL DEFAULT 0,private_snapshot jsonb NOT NULL,deadline timestamptz,created_at timestamptz NOT NULL DEFAULT now(),finished_at timestamptz);
CREATE TABLE match_player (match_id uuid REFERENCES match(id),seat smallint CHECK(seat IN (0,1)),user_id uuid NOT NULL REFERENCES app_user(id),PRIMARY KEY(match_id,seat),UNIQUE(match_id,user_id));
CREATE TABLE match_command (match_id uuid REFERENCES match(id),seat smallint NOT NULL,command_id uuid NOT NULL,request_hash text NOT NULL,expected_version bigint NOT NULL,accepted_version bigint NOT NULL,payload_private jsonb NOT NULL,receipt_private jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(match_id,seat,command_id),UNIQUE(match_id,accepted_version),FOREIGN KEY(match_id,seat) REFERENCES match_player(match_id,seat));
CREATE TABLE match_result (match_id uuid PRIMARY KEY REFERENCES match(id),winner_seat smallint CHECK(winner_seat IN (0,1)),reason text NOT NULL,score0 integer,score1 integer,rating_applied_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE outbox (id uuid PRIMARY KEY,match_id uuid REFERENCES match(id),version bigint,event_type text NOT NULL,payload_private jsonb NOT NULL,published_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX outbox_pending ON outbox(created_at) WHERE published_at IS NULL;
CREATE TABLE season (id uuid PRIMARY KEY,name text NOT NULL,start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,CHECK(end_at>start_at));
CREATE TABLE rating (season_id uuid REFERENCES season(id),user_id uuid REFERENCES app_user(id),rating integer NOT NULL DEFAULT 1000,games integer NOT NULL DEFAULT 0,PRIMARY KEY(season_id,user_id));
CREATE TABLE rating_change (match_id uuid REFERENCES match(id),user_id uuid REFERENCES app_user(id),before_value integer NOT NULL,after_value integer NOT NULL,PRIMARY KEY(match_id,user_id));
CREATE TABLE friend_request (sender uuid REFERENCES app_user(id),recipient uuid REFERENCES app_user(id),status text NOT NULL CHECK(status IN ('pending','accepted','declined')),created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(sender,recipient),CHECK(sender<>recipient));
CREATE TABLE user_block (blocker uuid REFERENCES app_user(id),blocked uuid REFERENCES app_user(id),created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(blocker,blocked),CHECK(blocker<>blocked));
CREATE TABLE user_follow (follower uuid REFERENCES app_user(id),followed uuid REFERENCES app_user(id),PRIMARY KEY(follower,followed),CHECK(follower<>followed));
CREATE TABLE post (id uuid PRIMARY KEY,author_id uuid NOT NULL REFERENCES app_user(id),body text NOT NULL CHECK(length(body) BETWEEN 1 AND 5000),visibility text NOT NULL DEFAULT 'public' CHECK(visibility IN ('public','friends','private')),status text NOT NULL DEFAULT 'visible' CHECK(status IN ('visible','hidden','deleted')),match_id uuid REFERENCES match(id),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX feed_cursor ON post(created_at DESC,id DESC) WHERE status='visible';
CREATE TABLE comment (id uuid PRIMARY KEY,post_id uuid NOT NULL REFERENCES post(id),author_id uuid NOT NULL REFERENCES app_user(id),parent_id uuid REFERENCES comment(id),body text NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),status text NOT NULL DEFAULT 'visible' CHECK(status IN ('visible','hidden','deleted')),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE reaction (post_id uuid REFERENCES post(id),user_id uuid REFERENCES app_user(id),kind text NOT NULL CHECK(kind IN ('like')),PRIMARY KEY(post_id,user_id,kind));
CREATE TABLE notification (id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_user(id),kind text NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),read_at timestamptz);
CREATE TABLE media (id uuid PRIMARY KEY,owner_id uuid REFERENCES app_user(id),object_key text UNIQUE NOT NULL,mime_type text NOT NULL,byte_size bigint NOT NULL CHECK(byte_size BETWEEN 1 AND 5242880),status text NOT NULL CHECK(status IN ('pending','approved','rejected')),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE report (id uuid PRIMARY KEY,reporter_id uuid NOT NULL REFERENCES app_user(id),subject_type text NOT NULL CHECK(subject_type IN ('user','post','comment','match')),subject_id uuid NOT NULL,reason text NOT NULL,status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','resolved','dismissed')),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE moderation_action (id uuid PRIMARY KEY,report_id uuid REFERENCES report(id),actor_id uuid NOT NULL REFERENCES app_user(id),action text NOT NULL,reason text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_log (id uuid PRIMARY KEY,actor_id uuid REFERENCES app_user(id),action text NOT NULL,subject_type text NOT NULL,subject_id text NOT NULL,metadata jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
COMMIT;

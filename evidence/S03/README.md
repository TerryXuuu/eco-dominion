# S03 evidence

Observed on 13 October 2026 against a production build with real Neon Auth and the Neon database.

- `browser-observation.log`: two-browser feed, like/comment, block, forbidden edits, ordinary-user moderation refusal, report, hide, dismiss and audit trail.
- `second-browser.log`, `bea-forbidden.json`, `bea-after-block.json`, `second-player-engage.json`, `bea-community.png`, `post-id.txt`: independent headless Chrome as ordinary players.
- `moderation-queue.png`, `audit-trail.png`, `inbox.png`: Ada as moderator.
- `grant-moderator.log`: operator grant of moderator to @s01ada.
- `automated-checks.log`, `build.log`: 53/53 tests and production build.
- `neon-schema-apply.log`, `neon-schema-rerun.log`: `db/003_community.sql` applied; rerun is a no-op.

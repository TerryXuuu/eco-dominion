# S02 evidence

Observed on 13 October 2026 against a production build with real Neon Auth and the Neon database.

- `browser-observation.log`: the two-browser match, concurrency, reconnect, result, rating, history, leaderboard, replay and leak checks.
- `second-browser.log`, `second-browser-network.jsonl`, `second-browser-final.png`, `match-id.txt`: Bea's headless browser.
- `ada-browser-network.jsonl`, `ada-board-midmatch.png`, `ada-match-finished.png`, `ada-replay-final-step.png`, `leaderboard.png`: Ada's browser.
- `leak-check.log`: both network views checked against the authoritative states rebuilt from Neon.
- `automated-checks.log`, `build.log`: the test suite (49/49) and production build.
- `neon-schema-apply.log`, `neon-schema-rerun.log`: `db/002_play.sql` applied to Neon; the rerun is a no-op.

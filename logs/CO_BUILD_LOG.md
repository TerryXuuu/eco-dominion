# Co-build log

16-hour revision prepared; four implementation blocks remain unexecuted. No application/deployment acceptance claimed. Record actual hours, decisions, checks and blockers here during development.

11 October 2026, S01 in progress: application foundation is implemented and locally typechecked, built, and tested. Browser observation without Neon credentials: `/profile` redirects to `/login`; `GET /api/profile` returns 401 `private, no-store`; `GET /api/players/ada` returns 404; `/rules` shows the R22 energy example and R01 final-turn text as an unapproved draft. Two-account registration, logout, recovery delivery, and Neon schema application were not observed. Blocker: owner approval of R01–R26 and a local `.env` with `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `NEXT_PUBLIC_APP_URL`. Windows needs `PYTHONUTF8=1` when running the controller because the session prompts contain punctuation the default GBK console cannot read. No deployment claimed.

13 October 2026, S01 completion: both blockers were cleared. The owners recorded their approval of the rulings, and Neon was linked with local `.env` and `.env.local` files, which are gitignored. Observed against a production build with real Neon Auth: two accounts registered with separate profiles, logout works, a private profile returns 404 to the other account, a handle clash returns 409, a cross-origin PATCH returns 403, and unauthenticated requests get 401, a redirect, or 404. Recovery issued a real reset token, and the reset changed the password: the old password was refused and the new one worked. Email delivery to the `.test` address was not observed. Observation found two defects, both fixed: logout depended on the upstream call succeeding, and auth forms hung on network errors. Neon Auth was intermittently unreachable from this network (one of its three IPs refused connections), so several steps needed retries. Details: `evidence/S01/browser-two-account-observation.log`. No deployment.

13 October 2026, S02 (started 08:42Z, deadline 12:42Z, no extension): online PvP is implemented on the unmodified reference engine. It includes:
- private rooms and a casual queue, both with transactional admission;
- authenticated read, command, replay, history and leaderboard routes;
- seat-safe projections and a full-card board UI with every choice type;
- version polling, idempotent commands, persisted R26 deadlines, reconnect and concede;
- one result per match, with casual-only Elo.

The owners decided the exact R26 timeout algorithm and casual-only rating (K=32, start 1000), and ranked play stays disabled. `db/002_play.sql` is applied to Neon.

Observed with two real browsers:
- A complete casual match reached version 59 with 59 accepted commands. Bea won 18–0, and the ratings went 1000 → 1016 and 1000 → 984, each applied once.
- History, leaderboard and replay all agree with the result.
- Five concurrent duplicate commands applied once, and stale commands got 409.
- A reload restored the same state.
- A leak check rebuilt every state from Neon and found no hidden information in either browser's responses.

Observation found two defects, both fixed:
- An embedded tab's poller stopped after it was treated as hidden.
- An unreachable Neon Auth made signed-in players look signed out (401). Session lookup now retries, and the routes answer 503.

Tests 49/49, typecheck and build pass. Details: `evidence/S02/browser-observation.log`. No deployment.

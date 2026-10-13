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

13 October 2026, S03 (deadline 16:10Z, no extension): community is implemented on the existing profile, block, friend and role tables, with `db/003_community.sql` adding report resolution columns, moderation subjects and feed indexes. It includes a paginated plain-text feed, posts/comments/likes, friends/follows/blocks, in-app notifications, reports, moderator hide/restore/suspend and an audit trail. Server-side checks cover ownership, visibility, blocks, roles and room invites (friends only). Suspended users can read and cannot mutate. Ada (@s01ada) was granted moderator by owner decision; ordinary players stay players.

Observed with two real browsers:
- Ada published a public post. Independent player browsers liked and commented, were refused on cross-user edit (403) and moderation (403), filed reports (201), then blocked Ada and no longer saw the post (feed empty, thread 404).
- Ada's moderation queue showed the reports; hide made the post 404; dismiss closed the rest; the audit trail lists role.grant, report.create, moderation.hide and moderation.dismiss.

Tests 53/53, typecheck and build pass. Details: `evidence/S03/browser-observation.log`. No deployment.

13 October 2026, S04 (deadline 16:41Z, no extension): integrated validation. Service-level mutationGate refuses suspended queue, commands, posts and follows (HTTP already did). Mobile nav wraps; compose shows Publishing…; README records how to run locally and the known limitations. Observed: S02 replay step 59 is stable across repeat fetches with the opponent hand omitted; two browsers repeated post/like/comment/403-moderation/block; phone-sized nav wraps. Tests 55/55, typecheck and build pass. Source handoff only; no deployment.

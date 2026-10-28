# Decisions

Architecture 2.0 replaces 1.0 for this edition at owner request: four 4-hour blocks, single Next.js app with Neon/Auth, Cursor IDE, GitHub, eventual Vercel. Setup and final publishing excluded. Original package preserved. No previous session accepted. Digital rule proposals still await actual owner approval.

11 October 2026: owner requires automatic by default. Architecture 2.3 changes orchestration only; 16-hour schedule and application stack remain. The source starter has no accepted production blocks.

11 October 2026, S01 implementation note: the app uses Next.js 16.4 App Router, `@neondatabase/auth` 0.5.0-beta (`createNeonAuth`), and `@neondatabase/serverless` 1.2 request-scoped transactions. R01–R26 remain an unapproved draft. No `decisions/OWNER_RULES_APPROVAL.md` was written. The ruleset row is inserted only by `tools/apply-schema.mjs`, with `approved_at` left null, and that script has not been run because `DATABASE_URL` is absent.

13 October 2026, superseding the note above: Lynx and Terry approved R01–R26 as written in `decisions/OWNER_RULES_APPROVAL.md`, which the owners filled in themselves. Ranked release was not approved: ranked play stays disabled until balance testing, and only local and casual play are allowed. Neon project `calm-resonance-31642684`, branch `production`, has Neon Auth enabled (`neon.ts` `auth: true`). `tools/apply-schema.mjs` now refuses to run unless the approval file approves every ruling. It applied the schema and stored ruleset `digital-1.0` with `approved_at` 2026-10-13 and `ranked=false`. Sign-out clears the local Neon Auth cookies even when the upstream revocation call fails, so a network failure can no longer leave a user signed in.

13 October 2026, owner decision (Terry): keep the S01 change to `tools/session_controller.py` `execute()`, committed in `1ab75aa`, even though the session prompts forbid editing orchestration code. On Windows, Python cannot launch `npm` (a `.cmd` script) by its bare name, so `finish` could never run the typecheck and build checks. `execute()` now resolves the executable path with `shutil.which` and decodes output as UTF-8. Gates are unchanged: all four required checks still run and must pass. Known limitation: `tools/test_session_controller.py` copies the live repository state, so its `checkpoint` assertions fail while a session is in progress, and its copy now includes `node_modules`, so it runs slowly.

13 October 2026, owner decisions (Terry) for S02:
- R26 executable timeout specification, approved exactly as follows. The turn clock gives 90 seconds from when the active player's deploy phase starts, covering deploy and tactics. Each forced choice gets 30 seconds from when it reaches the front of the queue. Reconnecting never resets a clock. When a clock expires, the server acts for the overdue seat:
  - Discard: the most recently drawn cards (the end of the hand) go first.
  - Rest: the first controlled region in the order forest, water, wild, domain.
  - Migration: skip.
  - Invasion: forest.
  - Turn expiry: pass through to settlement.

  Each expiry counts one timeout for that seat, and the count resets to 0 whenever that seat makes an accepted move itself. A seat's third consecutive timeout forfeits the match with reason `timeout`, instead of the server acting for it. Concede is allowed at any time, even off turn. Ranked play is disabled, so outages do not void casual results. When deadlines are processed late (on the next read or command), each follow-on deadline is measured from the deadline that expired, not from the time of access.
- Ratings: only casual-queue matches are rated, with Elo K=32 starting at 1000 and labelled "casual rating". Private-room matches are unrated. This is not ranked play, which remains disabled.

13 October 2026, owner decision (Terry) for S03: Ada Forest (@s01ada) is granted the moderator role so reports, hide/suspend actions and the audit trail can be observed in a real browser. Bea Meadow stays an ordinary player and is the account that must be refused when she tries to moderate. Roles are stored in `user_role` and granted only by the operator script `tools/grant-role.mjs`; there is no self-service promotion.

18 October 2026, owner request (Terry): @tianruixu4 (tianruixu4@gmail.com) was granted admin and keeps player. Lynx (@unikengine, unik.engine@gmail.com) was created as player and admin. Role changes stay audited. No self-service promotion.

18 October 2026, owner request (Terry): /admin is the admin console for accounts and registrations, moderator/admin grants, audited casual-rating adjustments, and read-only match records. /moderation stays the report queue. An admin cannot suspend themselves or remove their own admin role. Match boards stay private to the players. The public leaderboard still lists a player only after a casual game.

13 October 2026, S04 handoff: no new owner rulings. Ranked play remains disabled. Limitations observed across S01–S04 are listed in README.md (no wall-clock timeout worker, no `.test` email delivery, intermittent Neon Auth, no media uploads, no Vercel publish). Source is the handoff; this is not a production release.

28 October 2026, owner request (Terry): after sign-in the player lands on /home, a personal record of rating, rank, results, opponents, weekly activity, and badges. The header keeps the same tabs on every page and, once signed in, shows level, display name, and Log out. Profile accepts a local avatar. List headings filter and sort. A fixed footer shows copyright and contacts, edited from the admin console. Accounts are admin, player, or guest. A guest can read the leaderboard and community and cannot play or post. Moderator remains available for the report queue.

28 October 2026, owner request (Terry): Profile is a button in the header and on the personal home. Home keeps the weekly chart and adds a year of daily play, win and day streaks, peak rating, best score, and achievement seals. Level is drawn as a rank seal, from Seed at level 1 through Dominion at level 35.

27 October 2026, owner request (Terry): the first turn was usually a pass because it refreshed to 1 energy and most opening cards cost 2 or more. Personal turn t now refreshes to max(3, t) energy, still capped at 10. Turns 1 and 2 therefore open on 3; from turn 3 the previous curve is unchanged, so an 8-cost legend is still a turn-8 card. This changes the opening numbers of R02 for play. The stored ruleset hash is unchanged.

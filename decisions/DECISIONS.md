# Decisions

Architecture 2.0 replaces 1.0 for this edition at owner request: four 4-hour blocks, single Next.js app with Neon/Auth, Cursor IDE, GitHub, eventual Vercel. Setup and final publishing excluded. Original package preserved. No previous session accepted. Digital rule proposals still await actual owner approval.

11 October 2026: owner requires automatic by default. Architecture 2.3 changes orchestration only; 16-hour schedule and application stack remain. The source starter has no accepted production blocks.

11 October 2026, S01 implementation note: the app uses Next.js 16.4 App Router, `@neondatabase/auth` 0.5.0-beta (`createNeonAuth`), and `@neondatabase/serverless` 1.2 request-scoped transactions. R01–R26 remain an unapproved draft. No `decisions/OWNER_RULES_APPROVAL.md` was written. The ruleset row is inserted only by `tools/apply-schema.mjs`, with `approved_at` left null, and that script has not been run because `DATABASE_URL` is absent.

13 October 2026, superseding the note above: Lynx and Terry approved R01–R26 as written in `decisions/OWNER_RULES_APPROVAL.md`, which the owners filled in themselves. Ranked release was not approved: ranked play stays disabled until balance testing, and only local and casual play are allowed. Neon project `calm-resonance-31642684`, branch `production`, has Neon Auth enabled (`neon.ts` `auth: true`). `tools/apply-schema.mjs` now refuses to run unless the approval file approves every ruling. It applied the schema and stored ruleset `digital-1.0` with `approved_at` 2026-10-13 and `ranked=false`. Sign-out clears the local Neon Auth cookies even when the upstream revocation call fails, so a network failure can no longer leave a user signed in.

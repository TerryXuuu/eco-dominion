# Eco Dominion — 16-hour Cursor work plan

Environment setup and final deployment are excluded. Stack: Cursor IDE Agent, GitHub, Next.js, Neon PostgreSQL + Neon Auth, and Vercel as the eventual hosting target.

| Block | Hours | Outcome |
|---|---:|---|
| S01 — Accounts, rules and application foundation | 4 | Owner approval recorded; two users register/login with separate protected profiles; unauthorized access denied; schema integration and application build pass. |
| S02 — Playable online PvP | 4 | Two authenticated browsers finish a complete persisted match; duplicate commands apply once; stale commands rejected; hidden information protected; reconnect restores correct state; result/rating applied once. |
| S03 — Community and user management | 4 | Users interact through persistent feed and relationships; blocks/visibility respected; reports reach moderators; only authorized moderators can act; suspended users cannot mutate the platform. |
| S04 — Integrated validation, fixes and handoff | 4 | Local integrated platform passes observed core journeys, engine tests, integration tests, typecheck and production build; any unresolved critical issue blocks acceptance; source and ledgers are committed with no claimed deployment. |
| **Total** | **16** | **Four broad work blocks** |

## Working agreement

Use automatic prompt discovery and bounded context per broad block; minor steps stay inside that block. Open eco-dominion as the repository and send the kickoff instruction from KICKOFF.md; the agent discovers the active prompt. The default IDE route needs no CLI; an optional unattended runner uses a preinstalled authenticated Cursor CLI. Reuse the supplied tested reference engine and all 36 card types. At the end of a block, save observed evidence, commit the implementation and advance the ledger only after its acceptance checks pass. If time runs out, record unfinished work and resume that same block. Do not claim the 16-hour target was achieved if more work was needed.

## Included core platform and explicit boundaries

a working complete core platform for a small community: registration/login/recovery, profiles, two-player private and casual matches, server-authoritative full-card gameplay, reconnect, history/replay, simple ratings/leaderboard, community posts/comments/likes, friendship/follows/blocks, notifications, reports and moderator actions. It is an aggressive implementation timebox, not a guarantee of production readiness. Advanced artwork, image uploads, custom MFA, elaborate seasons/tournaments, large-scale performance qualification and operational hardening are outside this compressed core platform. These scope boundaries are explicit; no final deployment session is required.

## Preconditions outside the clock

Cursor and its usable agent allowance, Node/Git tooling, repository access, Neon database and Auth settings, required email delivery, environment secrets and eventual Vercel access are already prepared. This edition contains no environment installation tutorial and no final deployment task. Implementing application/auth/database integration is still inside S01. The final local production build and verification remain inside S04. Do not confuse a local build with a deployed release.

## Architecture

Single Next.js app; server-authoritative HTTP commands; version polling; Neon transactions; no Redis or separate API server. See ARCHITECTURE_FREEZE.md for command locking, identity mapping and deadline behavior.

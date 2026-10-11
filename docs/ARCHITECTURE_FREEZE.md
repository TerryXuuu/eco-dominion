# Architecture freeze 2.3 — 16-hour edition

Workflow revision frozen on 11 October 2026 in response to the owner's explicit schedule and platform change. This replaces architectures 1.0, 2.0 and 2.1 for this new package; the original package and authoritative source documents remain unchanged. No implementation sessions were previously accepted.

## Budget and scope
Four broad sessions of four hands-on hours each: exactly 16 hours. Environment preparation and final deployment are excluded. No additional setup or contingency hours are included. Cursor monthly subscription, GitHub repository, Neon project/auth configuration and Vercel project must already be available. Provider subscriptions, email delivery and usage limits are prerequisites, not promised by this package.

The deliverable is a working complete core platform for a small community: registration/login/recovery, profiles, two-player private and casual matches, server-authoritative full-card gameplay, reconnect, history/replay, simple ratings/leaderboard, community posts/comments/likes, friendship/follows/blocks, notifications, reports and moderator actions. It is an aggressive implementation timebox, not a guarantee of production readiness. Advanced artwork, image uploads, custom MFA, elaborate seasons/tournaments, large-scale performance qualification and operational hardening are outside this compressed core platform. These scope boundaries are explicit; no final deployment session is required.

## Frozen stack
One Next.js App Router application with TypeScript on the Vercel Node runtime; Neon PostgreSQL for all durable state; Neon Auth for managed authentication, using its current official Next.js SDK; GitHub for source/history; Cursor IDE Agent for the four sessions, with automatic orchestration as the default. Verify and lock compatible package versions during implementation. Do not assume a Cursor CLI, unlimited monthly agent usage or additional subscriptions.

Use one project rather than separate web/API services. No Redis, container platform or dedicated game server. Browser commands use authenticated HTTP POST. Clients poll their authorized match view every approximately one second while active and five seconds while idle; stop background polling and refetch on focus/reconnect. These are tuning defaults, not measured capacity promises. Responses are private/no-store and projected for the requesting seat; never disclose hidden hands, decks or RNG seeds.

## Authority and consistency
Validate identity on every server entry point, map provider subject to internal app_user UUID, enforce membership/roles/blocks and input limits. Neon Auth owns passwords and auth sessions; app tables own profiles, moderation and game permissions.

Each command uses a request-scoped Neon Pool/Client interactive transaction: BEGIN, lock match row FOR UPDATE, check membership, idempotency key plus payload hash and expected version, apply the pure engine, persist state/receipt/result/rating once, COMMIT, release connection. Roll back failures. Batch HTTP transactions cannot contain application logic between queries. No in-memory authoritative state and no network waits inside a database lock. Retry-safe queue matching and ratings use transactions and unique constraints.

Timeouts are enforced from persisted deadlines during commands and match reads, including atomic version changes. A match with no readers advances when next accessed; unattended wall-clock processing would require a scheduler and is outside the initial implementation. Local engine remains a reference harness, not the production API. Production uses secure private RNG, approved versioned rules and server-side projections.

## Acceptance and change control
Keep all 36 card types and the original source baseline. Digital rules 1.0-draft remain proposals until actual owner approval. S01 records this approval; unresolved rules block ranked release, never forge approval. Each broad session requires observed evidence, meaningful target tests, a rollback checkpoint, implementation commit and separate ledger transition. At four hours, record unfinished work and resume the same block; never manufacture acceptance to meet the estimate. An overrun means the 16-hour target was missed and must be reported without adding hidden hours.

Validate local production build, two independent authenticated browsers, concurrent duplicate/stale requests, privacy, reconnect and moderation. Final Vercel publishing, custom domains, production credentials and live operational verification are outside the 16-hour work plan. Architecture changes require a recorded decision and regeneration of hashes, contracts and affected prompts.

## Default automatic orchestration
Start once by reading KICKOFF.md and sending its instruction in Cursor Agent. Bundled AUTOMATIC_WORKFLOW.md plus always-applied rules discover the active prompt and invoke tools/auto_run.py prepare and finish. The agent executes one bounded block; the controller runs required checks, verifies evidence, creates an implementation commit and audit commit, then hands off the next block. No session prompt copying or manual Git/ledger transitions. Each block has its own acceptance boundary and commit. The orchestrator continues only after the prior block ends and passes. Cursor conversation/tool permission limits may require resuming the KICKOFF.md instruction; this is not a background daemon.

For unattended fresh-agent sessions, python tools/auto_run.py run launches a preinstalled, authenticated Cursor CLI with the prompt as an argument, independently per block. It discovers agent or cursor-agent; no ECO_AI_COMMAND setup is required for the default CLI route. Provider/tool installation and login remain preconditions outside the 16-hour course. Human rules approval, genuine browser evidence, missing credentials, tool permissions or quota limits are real blockers, never simulated successes.

State and hashes retain prior accepted records when upgrading an existing checkout. This new starter has zero accepted sessions, as did its source. Pause preserves changes and checkpoints; resume continues the same active block. A per-block wall-clock deadline is persisted and never reset silently; explicit extension is recorded as an overrun. Automatic runner is tested with isolated synthetic agents; actual Cursor account execution is not exercised in this package.

## Kickoff revision 2.3

The project folder is eco-dominion. KICKOFF.md is the project-local student entrance. The primary entry is one plain-language Cursor Agent instruction to read AUTOMATIC_WORKFLOW.md and run it. The automatic workflow is included in the repository. The always-applied project rule points to the same file. Engine, stack, four-block budget and acceptance gates are unchanged.

## Student entrance revision 2.3

The student package uses KICKOFF.md and AUTOMATIC_WORKFLOW.md directly. Optional skill and slash-command files are removed. The project rule remains always applied. Neon and Vercel are required architecture targets: Neon database/auth integration during development, Vercel hosting after the development budget. Account setup and final publishing remain outside the four 4-hour blocks. No app implementation acceptance is claimed by this packaging revision.

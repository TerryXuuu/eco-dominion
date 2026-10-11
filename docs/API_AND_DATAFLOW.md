# API and data flow


Validate identity on every server entry point, map provider subject to internal app_user UUID, enforce membership/roles/blocks and input limits. Neon Auth owns passwords and auth sessions; app tables own profiles, moderation and game permissions.

Each command uses a request-scoped Neon Pool/Client interactive transaction: BEGIN, lock match row FOR UPDATE, check membership, idempotency key plus payload hash and expected version, apply the pure engine, persist state/receipt/result/rating once, COMMIT, release connection. Roll back failures. Batch HTTP transactions cannot contain application logic between queries. No in-memory authoritative state and no network waits inside a database lock. Retry-safe queue matching and ratings use transactions and unique constraints.

Timeouts are enforced from persisted deadlines during commands and match reads, including atomic version changes. A match with no readers advances when next accessed; unattended wall-clock processing would require a scheduler and is outside the initial implementation. Local engine remains a reference harness, not the production API. Production uses secure private RNG, approved versioned rules and server-side projections.


Routes: auth SDK handlers; profile read/update; room create/join and queue enter/cancel; match view and command; results/history/leaderboard; feed/post/comment/reaction; friendship/follow/block; notification read; report and moderator action. Every mutation validates identity, shape, ownership and limits server-side. Use parameterized SQL, same-origin mutation checks, bounded pagination, sanitized text rendering, generic public errors and durable database-backed rate limits. Match view returns only actor-safe projection plus version/deadline. Queue enrollment has one active entry per user; admission creates both seats atomically. Rating and result are written once in the finishing transaction.

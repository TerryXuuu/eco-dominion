# Co-build log

16-hour revision prepared; four implementation blocks remain unexecuted. No application/deployment acceptance claimed. Record actual hours, decisions, checks and blockers here during development.

11 October 2026, S01 in progress: application foundation is implemented and locally typechecked, built, and tested. Browser observation without Neon credentials: `/profile` redirects to `/login`; `GET /api/profile` returns 401 `private, no-store`; `GET /api/players/ada` returns 404; `/rules` shows the R22 energy example and R01 final-turn text as an unapproved draft. Two-account registration, logout, recovery delivery, and Neon schema application were not observed. Blocker: owner approval of R01–R26 and a local `.env` with `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `NEXT_PUBLIC_APP_URL`. Windows needs `PYTHONUTF8=1` when running the controller because the session prompts contain punctuation the default GBK console cannot read. No deployment claimed.

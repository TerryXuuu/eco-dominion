# Automatic Eco Dominion contract 2.3

Automatic is the default. Read docs/ARCHITECTURE_FREEZE.md, TASKS.md, orchestration/state.json and AUTOMATIC_WORKFLOW.md. On the KICKOFF.md instruction or a request to start/resume Eco Dominion, discover the active prompt with python tools/auto_run.py prepare; never ask the user to copy session prompts. Execute only that bounded block, produce observed evidence, call finish, and let the orchestrator hand off the next block after its commit boundary. Missing approval, credentials, observed browser evidence, failing tests or exhausted budget cause a preserved blocked state. No automatic deployment. Four blocks × four hours; setup/publishing excluded. No forged approvals, evidence or accepted sessions. Preserve source documents, all card types and reference engine tests; no secrets in Git.

CLI workers are launched once per block by auto_run.py run. If ECO_AUTOMATION_WORKER=1, implement only the supplied block, save evidence, then return; never launch nested runners or alter orchestration/checkpoint state or commit acceptance. The parent controller owns checks and commits. IDE agents use prepare/finish directly. Inspect and preserve existing Git changes; never run destructive reset/clean. Report 4-hour deadlines and any explicitly granted extension as overrun.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

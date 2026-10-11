# Automatic Eco Dominion execution


1. Work in the eco-dominion repository root. Use the available Python 3 command (`python` on Windows, `python3` where applicable). Never require the user to paste prompts.
2. If ECO_AUTOMATION_WORKER=1, do NOT enter this loop: obey the supplied active block, save observed evidence and return. The external runner owns transitions.
3. Run `python tools/auto_run.py prepare`. It validates architecture, preserves history, creates a baseline/checkpoint when safe, reads the active prompt and emits its full bounded context. If blocked, inspect the reason and ask only for the actual missing decision/evidence; do not advance.
4. Read the emitted prompt, contract, decisions, existing evidence and Git status. Execute its implementation and meaningful tests. Record actual manual/browser evidence; require human observation if browser tools cannot perform it. Track the emitted deadline. Do not modify frozen architecture, weaken tests or fabricate owner approval.
5. If a blocker appears, run `python tools/auto_run.py pause "reason; exact next action"`, then stop. If the user requests a pause, do the same. Resume later with the KICKOFF.md instruction after the user resolves the blocker; call `python tools/auto_run.py resume` first. No rollback reset.
6. When the active block meets its acceptance, run `python tools/auto_run.py finish`. The controller reruns required checks and verifies evidence, commits implementation separately from ledger/audit metadata, and ends this block. On failure stop at the recorded blocked state; do not claim success or skip prerequisites.
7. At that commit boundary the block is finished. If a next block exists, return to step 3 automatically without asking for prompt copying or routine continuation approval. Use durable files as the new bounded context. If Cursor ends this conversation, the KICKOFF.md instruction resumes from the active state rather than replaying accepted blocks.
8. Stop when all four sessions are accepted, when genuinely blocked, when the user stops, or when a deadline expires. Summarize observed outcomes and limitations; no deployment claim.

No automatic account login or subscription provisioning. Tool permissions and user rules still apply. Use no extra coding subagents by default.

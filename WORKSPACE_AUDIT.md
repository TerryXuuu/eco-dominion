# Start automatic Eco Dominion

Open eco-dominion as the project root in Cursor Agent and send the kickoff instruction from KICKOFF.md once. The included workflow and rules load the current prompt, create the safe baseline/checkpoint, and run the four blocks with checks, evidence, separate commits and TASKS transitions. No manual S01–S04 prompt copying. The automatic workflow is included in the repository; KICKOFF.md and AUTOMATIC_WORKFLOW.md are included in the project.

Use one active agent at a time. Cursor's own tool permissions remain effective. Human rule approval and real observations are never replaced by automation. When a genuine blocker or the four-hour block deadline is reached, work stops with the exact next action. After resolving it, use `the KICKOFF.md instruction` to resume, following the recorded resume action. The IDE route requires an active Cursor conversation; it cannot keep running after Cursor stops it.

For unattended orchestration with fresh agent processes, from eco-dominion run `python tools/auto_run.py run`. An already installed and authenticated Cursor CLI (agent or cursor-agent) is required; the runner discovers it. It launches each prompt automatically and waits for verified acceptance before the next. No manual ECO_AI_COMMAND or prompt paste is required. Existing account/tool setup is outside this package's four 4-hour sessions. No API keys are included.

Status: `python tools/auto_run.py status`. Safe pause: `python tools/auto_run.py pause "reason; next action"`. Resume: `python tools/auto_run.py resume`, then send the KICKOFF.md instruction or the run command. Extensions use `python tools/auto_run.py resume --extend-hours N`; they are recorded as overruns and do not count as staying within 16 hours. Do not reset uncommitted work.

The runner initializes a new isolated Git repository only on a clean prepared starter. An existing repository must have an attributable baseline and no unrelated changes before a new checkpoint. It never rewrites accepted history. Commit identity must be configured in an existing checkout; a fresh starter uses Eco Dominion Starter attribution unless you set your name/email beforehand. Automatic commits remain local: no push or publishing.

Do not unzip this pack over an in-progress checkout: use a separate folder. To upgrade ongoing work, read docs/UPGRADE_EXISTING_WORK.md; migration must preserve accepted records and evidence.

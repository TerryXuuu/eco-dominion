# Eco Dominion — kick-off entrance

## Exactly where to start

1. Extract the ZIP into a new folder. Do not overwrite an in-progress project.
2. In Cursor, choose **File → Open Folder** and select **eco-dominion** inside the extracted pack. This is the project root, not the outer pack folder.
3. Open **KICKOFF.md** in that project.
4. Open **Cursor Agent** chat and send the following instruction **once**:

> Read KICKOFF.md, AGENTS.md and AUTOMATIC_WORKFLOW.md. Start or resume the automatic Eco Dominion workflow now. Discover the active session yourself, implement it, run its required checks, record observed evidence and Git commits, update TASKS through the controller, and continue automatically at each accepted session boundary. Stop only for completion, a genuine blocker, the time limit, or my request. Do not ask me to copy individual session prompts.

The controller and automatic workflow instructions are included in this folder. Start with the one instruction above.

## What happens automatically

The Agent reads AUTOMATIC_WORKFLOW.md and invokes `python tools/auto_run.py prepare`. The controller validates architecture/state, creates a safe Git baseline/checkpoint when appropriate and returns the active prompt. The Agent implements and records actual evidence. `python tools/auto_run.py finish` reruns checks, verifies evidence, records separate implementation/audit commits, updates TASKS and activates the next block. The Agent continues without per-session prompt copying.

Four broad blocks × four hours = 16 hours. Environment setup and final deployment are excluded. Before kickoff, have Cursor, Python 3, Node.js 24 and Git available, plus your GitHub, Neon and Vercel accounts/projects. Neon database/auth integration is used during development; Vercel is the required eventual host. Account setup and final deployment are outside the 16-hour development budget. Keep credentials in ignored local environment files; never paste secrets into prompts or commit them. Required owner rule decisions and real observation cannot be invented. A genuine blocker preserves work and stops progression. Cursor conversation, permission and usage limits still apply.

## Resume and optional terminal route

After resolving a recorded blocker, ask Agent to run `python tools/auto_run.py resume`, then send the same kickoff instruction. It resumes the active block and preserves accepted history. To request a pause, ask Agent to run `python tools/auto_run.py pause "reason; exact next action"`.

For unattended fresh-agent execution only, with an already installed/authenticated Cursor CLI, open the terminal in eco-dominion and run `python tools/auto_run.py run`. This is optional; the IDE entrance above does not require Cursor CLI.

## 中文启动说明

解压后，在 Cursor 中打开 **eco-dominion** 文件夹，而不是外层打包目录。打开项目根目录的 **KICKOFF.md**，在 Cursor Agent 中发送上面的英文启动指令一次即可。学生只需发送上面的启动指令。控制器会自动读取当前单元提示词、验证、记录独立 Git 提交、更新 TASKS，并在验收通过后继续下一单元。真实规则决策、凭据缺失、测试失败或时间限制会使流程安全暂停；不得伪造验收。

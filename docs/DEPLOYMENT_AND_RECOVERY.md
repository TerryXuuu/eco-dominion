# Source handoff and recovery

Final deployment is excluded from this plan. Vercel is the intended hosting target; no publishing or live release acceptance is included. Deliver committed source, lockfile, migrations, test evidence, environment variable names without secret values and known limitations. Recover development using recorded Git checkpoints and preserved evidence; never reset uncommitted user work automatically. Database backup/restore and live operational validation must be addressed when the owner subsequently prepares a public release.

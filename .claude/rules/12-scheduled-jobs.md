---
paths:
  - scheduler/**
---

# Scheduled Jobs

## Job registry

All scheduled jobs are defined in `scheduler/jobs.ts`. Each key has a JSDoc comment describing its purpose and cron schedule. The scheduler is started from `scheduler/index.ts` using `croner`.

When adding or modifying a job, update both:

- `scheduler/jobs.ts` — job definition and JSDoc
- `scheduler/index.ts` — cron schedule registration

One-off / manual jobs (e.g. `rotateKEK`, `documentS3Migration`) are defined in `jobs.ts` but not registered in `index.ts`; run them with `scheduler/_caller.ts <jobName>`.

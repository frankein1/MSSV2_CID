# AGENTS.md for project Mon Suivi Social

**Mon Suivi Social** is a CRM for social work case management designed to help public sector organizations (CCAS, CIAS, communes, associations, ministries) manage beneficiary cases and social support workflows.

1. [Purpose, Features and Target Users](.claude/rules/1-purpose-features.md)
1. [Tech stack Summary](.claude/rules/2-tech-stack-summary.md)
1. [Authentication & Security](.claude/rules/3-authentication.md)
1. [Data Model](.claude/rules/4-data-model.md)
1. [Backend Architecture](.claude/rules/5-backend-architecture.md)
1. [Frontend Architecture](.claude/rules/6-frontend-architecture.md)
1. [External Integrations](.claude/rules/7-external-integrations.md)
1. [Accessibility](.claude/rules/8-accessibility.md)
1. [Testing](.claude/rules/9-testing-general.md)
1. [Testing: Frontend](.claude/rules/10-testing-frontend.md)
1. [Testing: Backend](.claude/rules/11-testing-backend.md)
1. [Scheduled Jobs](.claude/rules/12-scheduled-jobs.md)
1. [Testing: Stats](.claude/rules/13-testing-stats.md)

---

## Project Structure Guide

### Nuxt 4 default layout

- **Client** → `app/` (components, composables, pages, layouts, middleware, plugins, utils, assets)
- **Server** → `server/` at the repo root

### Path aliases

- `~/` → `app/` (client-side)
- `~~/` → repo root; use for imports for root folders

### Non-obvious conventions

Conventions that are not discoverable from `ls`

```
server/
├── api/          REST (OAuth callbacks, document uploads, external integrations)
├── trpc/         Non-REST endpoints (procedures + routers wiring)
├── route/        Route definitions (`createQuery`/`createMutation`): input schema, securityCheck, handler, audit log
├── security/     Permission system (`permissions/`), structure-scoped validators, security rule types
├── services/     Business logic called by route handlers, one folder per domain
├── query/        Statistics/reporting queries
└── database/     Prisma repositories + authorization constraints

<root>
├── client/       Shared static data (classes, colors, labels, options)
├── scheduler/    Scheduled jobs (croner), see rule 12
├── types/        Types shared across server + client (single-side types stay in their bucket)
└── test/         Integration-test setup, fixtures, tRPC harness (unit tests sit next to source)

app/
└── components/   Prefixes (Atom*, Beneficiary*, Admin*, Stats*, …) mark domain grouping
```

---

## Development Guidelines

### Use theses commands for local development

- type checking: `pnpm lint:typecheck`
- developement server: `pnpm dev`
- seed database: `pnpm prisma db seed`
- unit and integration tests: `pnpm test`
- e2e tests: `pnpm test:e2e`

### Code Review Focus

- Type safety: No any, proper generics
- Imports: prefer aliases `~/` to relative imports `../../../` except for helpers/utils in the same folder
- Security: Access control at all layers, input validation
- Testing: Critical paths covered
- Accessibility
- Comments in code in English and not in French

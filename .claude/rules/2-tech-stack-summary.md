---
paths:
  - nuxt.config.ts
  - package.json
  - tsconfig.json
---

# Tech Stack Summary

## Frontend

- **Framework**: Nuxt 4 with Vue 3 Composition API
- **Language**: TypeScript v5 (strict mode, noUncheckedIndexedAccess)
- **Design System**: DSFR (French government design system)
- **UI Components**: @gouvminint/vue-dsfr (based on DSFR) v8
- **Form Validation**: VeeValidate v4 + Zod v3
- **Rich Text**: TipTap editor v3
- **Charts**: Chart.js v4
- **Styling**: CSS with SCSS preprocessor
- **Testing**: Vitest v4 (unit and integration tests), Playwright v1 (E2E tests)

## Backend

- **Runtime**: Node.js (exact version pinned in `package.json` `engines`)
- **Framework**: Nuxt SSR Rendering with tRPC v11 for type-safe RPC APIs
- **Type Safety**: Full TypeScript with strict compiler options
- **Validation**: Zod schemas for input/output validation
- **Package Manager**: pnpm

## Database

- **DBMS**: PostgreSQL 17
- **ORM**: Prisma v6 with mode relationship joins
- **Development**: `docker-compose.dev.yml` for local PostgreSQL, RustFS (S3) and OpenBao

## Authentication & Security

- **Primary SSO**: ProConnect (French government OAuth2/OIDC)
- **Session Management**: JWT tokens (HS256) in HttpOnly cookies
- **Access Control**: Role-based (6 roles) + structure isolation
- **API Security**: nuxt-security v2 with rate limiting, CSP, request size limits
- **Monitoring**: Sentry v10 (error tracking), Matomo (analytics)

## External Integrations

- **Email**: SMTP via nodemailer, queued in the `Email` table and sent by the scheduler
- **CRM**: Brevo API v3 (contacts/companies sync for users and structures)
- **Appointments**: RDV Service Public OAuth for external appointment booking
- **Data Directory**: Data Inclusion API, imported weekly, used to prefill partner organizations
- **Schools**: Data Education API, imported weekly (DataEducationSchool)
- **Analytics**: Metabase (statistics on an anonymized DB copy)

## Document Management

- **Storage**: PostgreSQL internal storage OR S3-compatible object storage (@aws-sdk), RustFS for local dev
- **Encryption**: OpenBao KMS for document encryption/decryption
- **Upload/Download**: REST endpoints at /api/document/upload and /api/document/download
- **Configuration**: Storage choice, S3 credentials, region, endpoint via environment variables

## Development Tools

- **Linting**: ESLint + Prettier formatting
- **Style linting**: stylelint for CSS/SCSS
- **Pre-commit Hooks**: Husky + lint-staged + talisman
- **CI/CD**: GitLab CI/CD with automated testing and deployment
- **Release Management**: commit-and-tag-version automation

---
paths:
  - server/api/proconnect/**
  - server/api/auth/**
  - server/middleware/**
  - server/lib/**
  - server/trpc/createContext.ts
  - app/composables/useAuth.ts
  - app/composables/useAuthState.ts
---

## Authentication & Security

### ProConnect Integration (Primary)

- OAuth2 + OIDC
- ID token and userinfo validation: signature against ProConnect JWKS public keys (RS256 by default, `NUXT_AUTH_PROCONNECT_SIGNING_ALGORITHM`), audience, issuer, nonce
- State/nonce mechanism for CSRF protection

### JWT Token Structure

- Payload is `{ user: { id } }` (user UUID only) — no PII, no role/status data
- HS256 signature (MSS secret), verified in `server/middleware/` which sets `event.context.auth.userId`
- 60-minute default expiration (`TOKEN_VALIDATION_IN_MINUTES`)
- Secure HttpOnly cookie prevents XSS token theft
- User context (role, status, structure) is always fetched from DB via `fetchUserContext()` utility
- Frontend gets user profile from `get-session` API (called on app init), not from the JWT

### Data Isolation

- Structure-based multi-tenancy: Users can only access data from their structure
- Repository constraints automatically filter queries by structure and role

### Security Configuration

- Rate limiting: 600 tokens per 5 minutes global, keyed on `x-real-ip`
- Request size: 1MB standard, 20MB for file uploads
- Content Security Policy: Enabled in production
- Sensitive endpoints: per-route rate limits in `routeRules` (e.g. 5/min on `user.authorizeExport`, 2/min on ProConnect logout)

### Audit & Compliance

- UserActivity tracking: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, ARCHIVE, EXPORT, IMPORT
- GDPR support: Data archiving and anonymization workflows
- CGU versioning: Track acceptance history and enforce updates
- RGAA accessibility: DSFR component library compliance

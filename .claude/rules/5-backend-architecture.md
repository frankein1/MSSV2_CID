---
paths:
  - server/**
---

## Backend Architecture

**Layered Request Flow**:
HTTP/tRPC Request → Middleware (Auth validation) → tRPC Procedure → Route Handler → Service Layer → Repository Pattern → Prisma ORM → PostgreSQL

### Security Layers

1. **Middleware**: JWT validation, user context extraction
2. **tRPC Procedure Level**: access scope gate — defined in `server/trpc/createRouter.ts`
3. **Route Handlers**: role and resource ownership checks via `securityCheck`
4. **Repository Pattern**: automatic data filtering by structure via **Constraints** (`server/database/constraints/`)
5. **Audit Logging**: UserActivity rows written by `createRoute` for routes declaring `auditLog`

### tRPC Procedures

Two procedure types (`server/trpc/createRouter.ts`):

| Procedure            | Who passes                                                       | Context provided      |
| -------------------- | ---------------------------------------------------------------- | --------------------- |
| `protectedProcedure` | Authenticated user **with a structure** (rejects Administrators) | `user` + `structure`  |
| `adminProcedure`     | Administrator only                                               | `user` (no structure) |

`protectedProcedure` already rejects Administrators and users without a structure — never re-check these in `securityCheck`.

### Layer responsibilities

Each layer has a single job — don't duplicate another layer's work:

- **Zod schema** (`inputValidation`): input shape, types, and constraints (min/max lengths, array bounds, required fields). Violations produce validation errors (BAD_REQUEST)
- **`securityCheck`**: authorization only — does this user have permission on this resource? Returns `false` → FORBIDDEN. Never use it for input validation (e.g. array size limits)
- **Handler / Service**: business logic only

### Security check conventions

- Centralized permission system in `server/security/permissions/` (`getAppContextPermissions`, `getFamilyFilePermissions`, `getFollowupPermissions`, `getDocumentPermissions`, `getSocialSupportPermissions`, `getCommentPermissions`, etc.)
- **`securityCheck` must use these permission functions** to determine authorization — never call role helpers (`isReferent`, `isAdmin`, `getGranteRole`, etc.) directly in `securityCheck`, handlers, or services. Role helpers are internal to the permission system (`server/security/permissions/`) and the constraint layer (`server/database/constraints/`) — they must not be used outside these boundaries
- Never write role deny-lists (`if (role === X) return false`). The permission system is allow-list by design
- Use `getAppContextPermissions(ctx)` for global role-based capabilities (module access, export rights). Use entity-level permission functions (`getFamilyFilePermissions`, `getFollowupPermissions`, etc.) when authorization depends on the user's relationship to a specific resource (ownership, referent assignment, membership)
- When input references external entities (user IDs, structure IDs, etc.), always verify they exist and belong to the caller's structure. Never trust client-supplied relationships between entities — resolve and validate them server-side

#### Structure-scoped validators (`server/security/validators/`)

Use these reusable validators to prove entities belong to the caller's structure instead of writing raw repository queries in `securityCheck`:

- **`validateOneBelongsToStructure(user, id, Repo.findUniqueOrThrow)`** — checks a single entity belongs to the user's structure via the repo's structure-scoped finder
- **`validateManyBelongToStructure(user, ids, Repo.count)`** — checks all IDs in an array belong to the user's structure (deduplicates, compares count)
- **`validatePartnerOrganizationIds(user, orgIds, contactIds)`** — validates partner organizations and their contacts belong to the structure

Check `server/route/helpers.ts` for domain-specific compositions before writing custom validation — e.g. `validateSocialSupportPartnerOrganisations` wraps `validatePartnerOrganizationIds` for social support routes with prescribing/instructor organizations and redirections.

Example — permission check + single entity validation:

```ts
const securityCheck = async (ctx: SecurityRuleContext, input: Input) => {
  if (!getAppContextPermissions(ctx).module.budget) {
    return false
  }
  return validateOneBelongsToStructure(
    ctx.user,
    input.budgetId,
    BudgetRepo.findUniqueOrThrow
  )
}
```

Example — permission check + batch entity validation:

```ts
const securityCheck = async (ctx: SecurityRuleContext, input: Input) => {
  if (!getAppContextPermissions(ctx).module.budget) {
    return false
  }
  return validateManyBelongToStructure(
    ctx.user,
    input.beneficiaryIds,
    BeneficiaryRepo.count
  )
}
```

### Route pattern

Routes are created via `createQuery` / `createMutation` factories (`server/route/createRoute.ts`).
Files follow the naming convention `[action].[query|mutation].ts`. kebab-case (`delete-document.mutation.ts`) preferred, camelCase (`getOne.query.ts`) is older convention.

```ts
// server/route/followup/create.mutation.ts
export const create = createMutation({
  inputValidation: createFollowupSchema,
  securityCheck: async (ctx, input) => {...},
  handler,       // receives { ctx, input } where ctx has user + structure
  auditLog: { key, target, targetId, action }
})
```

For admin-only routes, use `adminHandler` instead of `handler` (ctx has user but no structure):

```ts
export const getStructures = createQuery({
  inputValidation: schema,
  adminHandler // receives { ctx, input } where ctx has user only
})
```

Router wires it to tRPC (`server/trpc/routers/followup/router.ts`):

```ts
export const followupRouter = router({
  add: protectedProcedure
    .input(routes.create.inputValidation)
    .mutation(routes.create.execute)
  // admin routes use adminProcedure + executeAsAdmin
})
```

Router composition in `/server/trpc/routers/index.ts` aggregates domain routers. Error handling via `server/trpc/trpcErrors.ts`. Return DTOs instead of raw database models.

### Constraints (`server/database/constraints/`)

Each structure-scoped entity has a matching `*Constraints.ts` file that builds Prisma `where` clauses scoped by the user's structure and role. Repositories (`server/database/repository/`) consume these automatically — route handlers don't use constraints directly. When creating a new entity with a repository, create a matching Constraints file in `server/database/constraints/`.

### ORM conventions

- Do not use Prisma `include`, use `select`
- No direct SQL queries except in `scheduler/db-anonymizer` (and the `SELECT 1` of `server/api/health-check.ts`)
- Performance: avoid large joins, large data fetches (rather paginate)
- Performance: make use of `relationLoadStrategy: "query"` if necessary
- Batch operations: enforce limits in the Zod schema with `.min()` / `.max()`. In services, use `$transaction` or chunked queries — avoid unbounded `Promise.all` over individual DB calls

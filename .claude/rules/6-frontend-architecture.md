---
paths:
  - app/components/**
  - app/pages/**
  - app/composables/**
  - app/layouts/**
  - app/plugins/**
  - app/middleware/**
---

## Frontend Architecture

### State management

- State related data retrieved from DB (no store Vuex/Pinia)
- Nuxt auto-import of composables used for:
  - global state management (authentication, permission,...)
  - utils
  - singleton component interaction (snackbar, modal)
  - extensions (matomo,...)
  - wrapping of reused backend queries (only when necessary, useBeneficiaryDetails, useFamilyFileMinimalInfo)

### DSFR Components

Components are organized in domain folders under `app/components/` (e.g. `BeneficiaryDetails/`, `FamilyFileBudget/`, `HelpRequestForm/`, `StatsBar/`, `Workshop/`). `pathPrefix: false`: components are auto-imported by file name, without the folder prefix, so file names must be unique and carry the domain prefix (`Beneficiary*`, `Stats*`, `Workshop*`, …)

Prefer vue-dsfr rather than direct DSFR html when possible:

- Complete list of components : https://raw.githubusercontent.com/dnum-mi/vue-dsfr/refs/heads/main/src/components/index.ts
- Example of component docs: https://raw.githubusercontent.com/dnum-mi/vue-dsfr/refs/heads/main/src/components/DsfrButton/DsfrButtonGroup.md

#### Atomic Design

- Base components with Atom\* prefix
- Vee Validate Components with Vee\* prefix

### Type safety

- End-to-end: Prisma schema → tRPC router → Frontend types
- Automatic type generation from tRPC endpoints
- Zod runtime validation at API boundaries

### Links

- Always use `<NuxtLink>` instead of `<a>` — for both internal and external links
- For external links, add the `external` prop to `<NuxtLink>`

### Permissions

Two mechanisms for authorization decisions in components and pages — never check roles directly:

- **Global capabilities**: use `usePermissions()` (backed by `AppContextPermissions` from the server). Gates module access, export rights, edit rights. Example: `application.value.module.budget` to show/hide budget features
- **Entity-level capabilities**: use the `permissions` object returned by backend queries (e.g. `familyFile.permissions`, `followup.permissions`). Gates actions on a specific resource based on ownership, referent assignment, etc.

**`useAuthState()` role helpers** (`isAdmin()`, `isReferent()`, `isStructureManager()`, `isReceptionAgent()`) are reserved for **middleware and layout routing only** — choosing which app shell or page to render (e.g. admin panel vs. user panel, CGU acceptance flow). Never use them in components to gate actions, disable buttons, or hide features — use the permission mechanisms above instead.

### Routing

- File-based routing via Nuxt pages directory
- Type-safe route helpers in `app/utils/routes/` (`routes`, `apiRoutes`) — never hardcode paths
- CGU acceptance enforcement via middleware

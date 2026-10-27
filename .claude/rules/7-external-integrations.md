---
paths:
  - server/integrations/**
  - server/plugins/**
  - server/api/**
  - server/services/rdvsp/**
  - app/plugins/**
---

## Key External Integrations

### ProConnect (French Government SSO)

- **Purpose**: Single sign-on for agents
- **Authentication**: OAuth2 + OIDC
- **Config**: Client ID, Client Secret in environment variables
- **Flow**: Initiate → Authorize → Callback → Session Creation
- **Location**: `server/lib/proconnect.client.ts`, `server/api/proconnect/**`

### RDV Service Public (Appointment Booking)

- **Purpose**: External appointment scheduling system
- **Integration**: per-user OAuth2 (`server/api/auth/rdvservicepublic/callback.ts`), tokens stored in ExternalAccount; activated per structure by an admin
- **Data**: appointments are not stored in MSS — fetched on demand from the RDVSP API and shown in the beneficiary history
- **Location**: `server/lib/rdvsp-oauth.client.ts`, `server/services/rdvsp/**`

### Brevo (CRM)

- **Purpose**: contacts/companies sync of MSS users and structures, plus events
- **API Client**: `server/integrations/brevo/apiClient.ts` (REST API v3)
- **Usage**: admin routes (create/edit user and structure, toggle RDVSP) and `server/query/userActivity/addUserActivity.ts` (events)

### Email (SMTP)

- **Transport**: nodemailer (`server/lib/email/`)
- **Templates**: `server/email/`
- **Queue**: rows in the `Email` table, sent every 30 s by the `queuedEmailSender` scheduler job; reminder emails created by `emailCreator`

### Data Inclusion (French Social Services Directory)

- **Purpose**: Catalog of potential partner organizations by region and support topic
- **Features**: Partner organization search and enrichment
- **API Integration**: `server/integrations/data-inclusion/`, weekly import by the `dataInclusionStructureImport` scheduler job
- **Storage**: DataInclusionStructure (and legacy DataInclusionStructureV1), linked from PartnerOrganization

### Data Education (Schools Directory)

- **Purpose**: school catalog (with QPV / REP classification) linked to beneficiaries
- **API Integration**: `server/integrations/data-education/`, weekly import by the `dataEducationSchoolImport` scheduler job
- **Storage**: DataEducationSchool

### Matomo (Analytics)

- **Purpose**: Privacy-friendly website analytics
- **Configuration**: Host URL, Site ID via environment variables
- **Tracking**: Page views, user interactions
- **Plugin**: `app/plugins/matomo.client.ts`

### Sentry (Error Tracking)

- **Purpose**: Error monitoring and alerting
- **Integration**: Both Vue client and Node.js server
- **Features**: Error grouping, release tracking, performance monitoring
- **Configuration**: DSN, environment, trace sample rate via env vars
- **Plugins**: `app/plugins/sentry.client.ts` and `server/plugins/sentry.ts` (scheduler: `scheduler/utils.ts`)

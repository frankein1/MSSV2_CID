---
paths:
  - prisma/**
  - server/database/**
---

## Key Data Models

Source of truth: `prisma/schema.prisma`.

### Core Entities

| Model                  | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| **User**               | System user with roles                                 |
| **Structure**          | Organization (CCAS, CIAS, etc.)                        |
| **Beneficiary**        | Citizen receiving support                              |
| **FamilyFile**         | Groups beneficiaries of one household                  |
| **SocialSupport**      | Unified container for followups and file instructions  |
| **Followup**           | Case notes (1-1 with SocialSupport)                    |
| **FileInstruction**    | Instruction of a help request (1-1 with SocialSupport) |
| **HelpRequest**        | Financial aid request (1-1 with FileInstruction)       |
| **HousingHelpRequest** | Housing aid request (1-1 with FileInstruction)         |
| **SupportProgram**     | Enrolment of a beneficiary in a program ("dispositif") |
| **Budget**             | Family financial status                                |
| **Document**           | Stored files (content in DB or S3, encrypted)          |
| **Notification**       | User alerts                                            |
| **Workshop**           | Group activity session                                 |

Note: there is no Appointment model — appointments live in RDV Service Public and are fetched through `server/services/rdvsp/`.

### Related Models

- **Social support**: SocialSupportSubject (per-structure subjects), SocialSupportRedirection + RedirectionReason (redirection to a partner/external structure), Comment (discussion threads), MinisterEntity (used by `Ministere` structures)
- **Beneficiary**: BeneficiaryRelative (family members and associates), BeneficiaryContributingPartner, ArchivedBeneficiary (summary record created by the archive procedure; names anonymized after 1 year by the scheduler)
- **Support programs**: SupportProgramName, SupportProgramExitReason (per-structure)
- **Budget**: BudgetIncome, BudgetIncomeCustom, BudgetExpenses, BudgetExpensesLoan, BudgetExpensesDebt, BudgetExpensesCustom
- **Documents**: DocumentContent (file content when stored in DB)
- **Workshops**: WorkshopName (per-structure), WorkshopAttendee, WorkshopExternalAttendee (non-beneficiary attendees, anonymized later)
- **Partners**: PartnerOrganization, PartnerOrganizationContact
- **Auth**: Account (ProConnect), ExternalAccount (RDV Service Public OAuth tokens), ApiToken (bearer tokens for `server/api/public/`), CGUHistory
- **Audit / jobs**: UserActivity, Email (outgoing email queue), JobResult (scheduled job runs)
- **Imported catalogs**: DataInclusionStructure, DataInclusionStructureV1, DataEducationSchool

### Key Features

- **Multi-tenancy**: Structure-based isolation via repository constraints
- **Audit Trail**: UserActivity logs audited actions (routes declaring `auditLog`, ProConnect login/logout)
- **Beneficiary archiving**: a procedure, not a status — export (`exportBeneficiary`), then `beneficiary/archive.mutation.ts` hard-deletes the beneficiary (plus its family file if it was the only member, and its documents, S3 included) and creates an ArchivedBeneficiary. The `Archived` value of BeneficiaryStatus is obsolete, kept only because existing rows use it — never set it in new code
- **Beneficiary activation (Active/Inactive)**: not a soft delete — offboards beneficiaries the structure no longer follows
- **Deactivation flags**: User status (Active/Disabled), Structure `disabled`, `inactive` on PartnerOrganization and SocialSupportSubject
- **Customization**: per-structure social support subjects, workshop names, support program names, exit reasons and redirection reasons

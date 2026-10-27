---
paths:
  - '**/*.spec.ts'
  - test/**
---

# Testing

## Fixtures

- Use fixtures from `prisma/fixtures`
- Always prefer using ids from constant variables rather than direct values:
  - YES : `fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id`
  - NO : `5a055c3b-9e39-493d-bc4d-c59a0de8947d`

## Error Assertion Convention

- Use `.rejects.toThrow(/regex/i)` with a case-insensitive regex matching a stable fragment of the error message
- Never use bare `.rejects.toThrow()` — always assert on the error content

## Common Commands

- Run all tests via `pnpm test`

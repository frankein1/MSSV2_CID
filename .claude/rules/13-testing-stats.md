---
paths:
  - server/route/stat/**/*.spec.ts
---

# Testing: Stats

Stats specs use no custom fixtures: they assert counts computed over the seed data, so expected
values can't be read off the test setup.

## Pin values from the seed before changing a query

When a change must not alter stats results (refactor, query de-join, filter helper change), pin
the current values first:

1. Write the specs with empty `toMatchInlineSnapshot()` assertions, one per input the change
   affects (e.g. each `helpRequestSubject` value whose generated query changes).
2. Run them once on the **unchanged** code, locally and without `CI=true`: Vitest writes the
   values computed from the seed into the spec file. Keep the run log as the baseline.
3. Convert each filled snapshot into a literal `toBe` / `toEqual`, so no inline snapshot is
   left in the code.
4. Apply the change and run the same specs again: they must pass without modification.

## Rules

- Compare results with no guaranteed order (`groupBy` ties, `findMany` without `orderBy`) as
  maps, not arrays, so the pinned values don't depend on row order.
- Check that the seed actually exercises the input under test. If the output is the same with
  and without it (e.g. no seeded help request has a minister), the spec only pins the shape:
  say so in a comment. Adding seed rows shifts the numbers of every stats spec, so do it only
  as a deliberate change, with all affected specs re-pinned.
- Never re-record (`-u`) after the change: a failing assertion means the behavior changed.

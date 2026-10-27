---
paths:
  - '**/*.vue'
---

# Accessibility

## Compliance

Must be RGAA compliant (https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/)

## HTML components

- Use semantic HTML whenever possible
- Don't use tabindex > 0
- don't override DSFR components
- Use `aria-label` or `aria-labelledby` on every interactive element without visible text
- Use `aria-live="polite"` on dynamic content areas

## Lists

- Use semantic `<ul>` / `<ol>` + `<li>` for any repeated group of items — screen readers announce list length and let users skip ahead
- Apply `class="fr-raw-list"` (DSFR utility) on the `<ul>` / `<ol>` to remove bullet styling when a visual list marker is unwanted
- Never use bare `<div>` loops with `v-for` when the items form a list — wrap them in `<ul>` + `<li>`
- For description-style pairs (label + value), `<dl>` / `<dt>` / `<dd>` is acceptable as an alternative

## Headings

- Maintain a strict heading hierarchy — never skip levels (e.g. `<h2>` → `<h4>`)
- Use heading tags (`<h1>`–`<h6>`) for section titles, not `<p class="fr-text--bold">` — screen readers rely on headings for page navigation
- In content components rendered inside `BeneficiaryInfoSection` (`app/components/BeneficiaryDetails/`, uses `aria-level="4"`), sub-section titles should use `<h5>`
- Apply DSFR typographic classes (`fr-h5`, `fr-h6`, etc.) to control visual size independently of the semantic level when needed

## Focus management on dynamically revealed form fields

Focus a newly revealed element only on explicit user action (button click), never on component mount.

### When

- A button adds a new entry via `useFieldArray.push()`
- A button reveals a field via `v-if`

### How

Use the `useDynamicFieldFocus(containerRef, sectionSelector)` composable — the **parent** owns focus, children stay passive.

1. **Parent**: call `focusElementAdded()` right after `push()` or toggling visibility.
2. **Child (repeated items)**: add `data-field-group` to an existing element wrapping the first input — never add a wrapper div just for this.
3. **Child (single-field toggle)**: no `data-field-group` needed — the composable falls back to the container itself.

The composable waits for `nextTick`, finds the **last** element matching `sectionSelector` (default `'[data-field-group]'`) inside the container, and focuses its first focusable field.

### Where to place `data-field-group`

- **Single-root child component**: on the root element.
- **Fragment child component** (multiple roots): on the element that contains the first input.
- **Inline `v-for`** (no child component): on the repeated element.

### Anti-patterns

- **`v-autofocus` directive** on dynamically revealed form fields — fires on every mount, including non-user-triggered re-renders. Keep focus control in the parent.
- **Manual DOM focus** (`querySelector` + `.focus()`) in the parent's click handler — use the composable instead.

## Automatic testing

- End to end playwright tests for a11y validation with Axe plugin tool
- Test files in `e2e/` (a11y checks in `e2e/a11y.spec.ts`)
- Run E2E tests via `pnpm test:e2e`

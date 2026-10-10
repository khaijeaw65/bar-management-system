# Handoff — BRIEF-014 Design tokens as Tailwind utilities

| | |
|---|---|
| **Implementer** | kj (Cursor) |
| **Date** | 2026-10-10 |
| **Brief revision** | 2 |
| **Branch / PR** | `feat/BRIEF-014-design-tokens-tailwind` · PR #29 |
| **Commit** | `d1a28be` (implementation). Screenshots are on the following docs commit. |
| **Status** | Implemented — awaiting audit |

> Created at `Implemented`. Update it if review requests changes. Frozen at merge.

## Summary
Type, radius, tracking, and motion tokens from the design system are Tailwind utilities (`text-label`, `rounded-btn`, `tracking-caps`, `ease-ds-out`, `duration-(--dur-fast)`). The six arbitrary pixel classes in the POS shell now use those utilities. ESLint rejects new arbitrary numeric classes. Tailwind's `ease-out` / `ease-in-out` are not overridden.

## Acceptance Criteria
| AC | Result | Test |
|---|---|---|
| AC-1 | ✅ | `src/lib/theme/design-tokens.test.ts` — `AC-1 design-token utilities compile to the DS values` |
| AC-2 | ✅ | same file — `AC-2 HeroUI scale, easing, and colour utilities stay on their previous values` |
| AC-3 | ✅ | `git grep -nE '\-\[(#\|-?\.?[0-9])\|\-\[[^]]*px' app/frontend/src` — no matches |
| AC-4 | ✅ | `src/lib/lint/no-arbitrary-values.test.ts` — arbitrary `text-[13px]`, template literal, `#fff`, and `grid-cols-[1fr_320px]` fail; `text-small`, `grid-cols-[auto_1fr]`, `content-['']`, and `duration-(--dur-fast)` pass |
| AC-5 | ✅ | Mapping comment in `globals.css` inside `@theme inline` (type, radius, tracking, spacing, motion) |
| visual | ✅ | `docs/handoffs/assets/BRIEF-014/pos-shell-before-dark-1280.png`, `pos-shell-after-dark-1280.png`. Dark, 1280×800. Computed after: rail 88px, label 11px / 600 / line-height 15.4px / radius 10px, monogram and top-bar type 13px |

## Gate Evidence (G1)
Commands run on the `d1a28be` tree (the docs commit adds this handoff and the screenshots only).

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter @bar/frontend lint` | 0 | pass |
| `pnpm --filter @bar/frontend typecheck` | 0 | `next typegen && tsc --noEmit` pass |
| `pnpm --filter @bar/frontend test` | 0 | 14 passed · 0 failed · 0 skipped |
| `pnpm --filter @bar/frontend build` | 0 | pass |

### AC-3 grep
`git grep -nE '\-\[(#|-?\.?[0-9])|\-\[[^]]*px' -- app/frontend/src` — no matches.

## Sonar (local scan)
- Scanned commit: not scanned · Quality Gate: not run
- Issues by severity: none recorded — the scan did not start
- Remaining issues + reason: BRIEF-014 marks the local Sonar scan optional (styling/tooling only)
- Who fixed: n/a

## Decisions Raised
- none

## Deviations from Brief
- None. `cn()` was taught the new type, radius, tracking, and ease names so `tailwind-merge` does not drop `text-label` when it sits beside `text-text-accent`. Without that, the §3.5 rail class never reached the DOM (computed size stayed 16px).

## Known Gaps / Follow-ups
- Nine default-scale usages (`text-sm`, `text-xl`, `rounded-md`, `rounded-lg`) stay as they are. A later brief decides whether to migrate them.
- The brief file lives on `docs/ui-design-cd06`. This PR does not edit that branch, so the brief's PR field is still empty.
- `docs/rules/frontend.md` styling line is Field's follow-up after merge (brief §8).

## AI Usage
**High** — Cursor implemented the tokens, lint gate, tests, and shell class replacements. Field does not hand-code.

## Review Routing
- Assigned auditor: Cowork
- Next command: `audit BRIEF-014`
- PR: https://github.com/khaijeaw65/bar-management-system/pull/29 · Work SHA: `d1a28be` · self-check: primitive values match the DS token files (`--ease-out` renamed to `--ease-ds-out`); §3.5 replacements match the brief; AC-2 locks `rounded-sm/md/lg/xl`, `text-sm/base/lg`, `ease-out`, `ease-in-out`, and every `--color-*` utility

## Notes for Reviewer
- CSS check compiles `globals.css` with `@tailwindcss/postcss` and `@source inline(...)`. It does not read `.next`. `postcss` is loaded from the `@tailwindcss/postcss` dependency so no package was added.
- `--ease-ds-out` is the DS curve `cubic-bezier(.2,0,0,1)`. Tailwind's `--ease-out` stays `cubic-bezier(0, 0, 0.2, 1)`.
- `text-pos-total` line-height is 1.1. The DS bundle also uses 1.2 in some components; rev 2 says 1.1.
- Rail label is the intended visual change: 10px / line-height 1.2 → 11px / 1.4. Monogram 12px → 13px. Rail width stays 88px via `w-22`.
- The bad lint sample is built by string concatenation so the test file itself stays clean. No `eslint-disable` comments.

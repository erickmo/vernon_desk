# Typography Scale — Vernon Desk

**Date:** 2026-05-08  
**Status:** Approved  
**Scope:** `vernon_desk/public/css/vernon_desk.css`

---

## Problem

Current CSS has 10+ scattered hardcoded font-size values (0.65rem–0.85rem + px values + clamp) with no centralized token system. No consistent hierarchy. Hard to maintain.

---

## Decision

Introduce a 7-token font-size scale + 3-token line-height scale based on Tailwind UI ratios, using the existing 13px base (`html { font-size: 13px }`).

---

## Token Definitions

Add to `:root` in `vernon_desk.css`:

```css
/* ── Typography scale ───────────────────────────────────── */
--fs-2xs:  0.6875rem;   /* 8.9px  — badge, status tag, tiny label */
--fs-xs:   0.75rem;     /* 9.75px — timestamp, breadcrumb, meta   */
--fs-sm:   0.875rem;    /* 11.4px — nav item, table header, button */
--fs-base: 1rem;        /* 13px   — body text, table row, input   */
--fs-lg:   1.125rem;    /* 14.6px — section title, card heading   */
--fs-xl:   1.25rem;     /* 16.3px — page title (h1)               */
--fs-2xl:  1.5rem;      /* 19.5px — KPI number, hero stat         */

/* ── Line height ────────────────────────────────────────── */
--lh-tight:  1.2;       /* headings                               */
--lh-snug:   1.375;     /* nav, compact elements                  */
--lh-normal: 1.5;       /* body text                              */
```

---

## Element → Token Mapping

| Element | font-size | line-height |
|---|---|---|
| Badge / status tag | `--fs-2xs` | — |
| Timestamp · breadcrumb · meta | `--fs-xs` | `--lh-normal` |
| Nav item · table header · button | `--fs-sm` | `--lh-snug` |
| Body · table row · input | `--fs-base` | `--lh-normal` |
| Section title · card heading | `--fs-lg` | `--lh-tight` |
| Page title (h1) | `--fs-xl` | `--lh-tight` |
| KPI number · hero stat | `--fs-2xl` | `--lh-tight` |

---

## Migration Map

All hardcoded values to be replaced:

| Current value | Replace with |
|---|---|
| `0.65rem` | `var(--fs-2xs)` |
| `0.68rem` | `var(--fs-2xs)` |
| `11px` | `var(--fs-2xs)` |
| `0.70rem` | `var(--fs-xs)` |
| `0.74rem` | `var(--fs-xs)` |
| `0.75rem` | `var(--fs-xs)` |
| `0.78rem` | `var(--fs-sm)` |
| `0.82rem` | `var(--fs-sm)` |
| `0.85rem` | `var(--fs-sm)` |
| `clamp(0.95rem, 1.2vw, 1.15rem)` | `var(--fs-xl)` |

---

## Constraints

- Base `html { font-size: 13px }` stays unchanged — compact feel preserved.
- Responsive breakpoints (1440px → 12.5px, 1920px → 12px) stay unchanged — all tokens scale automatically.
- No build step — vanilla CSS only, no preprocessor.
- Never touch Frappe core files — only `vernon_desk.css`.
- All `!important` overrides to be preserved where they exist (Frappe specificity battles).

---

## Out of Scope

- Font family changes (Inter already set)
- Font weight system (not requested)
- Dark/light theme font color changes

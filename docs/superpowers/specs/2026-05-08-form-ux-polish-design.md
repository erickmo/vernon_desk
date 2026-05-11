# Form UI/UX Polish — Design Spec

**Date:** 2026-05-08  
**Scope:** DocType Form + Dialog/Modal  
**Approach:** A — Incremental Polish (CSS only, no JS)  
**File:** `vernon_desk/public/css/vernon_desk.css`

---

## Problem

Form tampilan saat ini memiliki tiga masalah:
1. **Padat** — padding antar field terlalu kecil, kurang breathing room
2. **Tidak ada hierarki visual** — semua section header terlihat sama, sulit di-scan
3. **Tampilan generik** — tidak ada karakter kuat, terasa seperti default Frappe

## Solution: Incremental CSS Polish

Pure CSS changes only. Tidak menyentuh HTML/JS Frappe. Target: "Polished & structured" seperti HubSpot/Salesforce modern.

---

## Changes

### 1. Section Header (`.section-head`, `.section-title`)

| Property | Before | After |
|----------|--------|-------|
| `border-left` | none | `3px solid var(--vd-accent, #6b5b95)` |
| `background` | transparent | `#f9fafb` |
| `padding` | 8px 12px | `10px 16px` |
| `font-size` | default | `var(--fs-xs)` |
| `font-weight` | 600 | `700` |
| `text-transform` | none | `uppercase` |
| `letter-spacing` | none | `0.06em` |
| `color` | #374151 | `#374151` (unchanged) |

### 2. Field Labels (`.control-label`, `label`)

| Property | Before | After |
|----------|--------|-------|
| `text-transform` | none | `uppercase` |
| `letter-spacing` | 0.01em | `0.05em` |
| `color` | #475569 | `#64748b` |
| `margin-bottom` | default | `5px` |

### 3. Section Body (`.section-body`)

| Property | Before | After |
|----------|--------|-------|
| `padding` | ~12px (Frappe default) | `16px` |
| Field `row-gap` | ~8px | `12px` |

### 4. Dialog / Modal (`.modal-dialog`, `.modal-content`)

**Header (`.modal-header`):**
- `background: #f9fafb`
- `padding: 14px 20px`
- `border-bottom: 1px solid #eef1f6`

**Close button (`.modal-header .close`, `.btn-modal-close`):**
- `width/height: 28px`, `border-radius: 8px`
- `background: #f1f5f9`, `color: #64748b`
- `border: none`

**Body (`.modal-body`):**
- `padding: 20px`
- Field gap: `12px`

**Footer (`.modal-footer`):**
- `background: #f9fafb`
- `padding: 12px 20px`
- `border-top: 1px solid #eef1f6`

---

## Constraints

- CSS `!important` required — overriding Frappe's bundled styles
- No changes to Frappe core files
- No JavaScript — all changes via CSS selectors only
- Must work with existing `--vd-accent`, `--fs-*`, `--vd-font` tokens

## Out of Scope

- Layout changes (2-column, sidebar) — Approach C
- JS-injected icons or card headers — Approach B
- Tab bar redesign
- Mobile/responsive adjustments

---

## Success Criteria

- Section headers visually distinct with left accent stripe
- Labels clearly readable with uppercase treatment
- Field rows have visible breathing room (16px padding, 12px gap)
- Dialog feels premium: subtle header bg, proper button hierarchy, rounded close
- No visual regressions in nav1/nav2, list view, or data table

## File Changed

- `vernon_desk/public/css/vernon_desk.css` — add/override rules in existing form section

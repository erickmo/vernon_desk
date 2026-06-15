# Vernon Desk — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-05-16  
**Status:** Active  
**Owner:** Erick Mo

---

## 1. Product Overview

Vernon Desk is a Frappe app that replaces the default Frappe Desk UI with a modern, premium interface. It delivers design system control and UI polish via CSS + vanilla JS injected through Frappe hooks — no build step, no Frappe core changes.

**Target users:** ERPNext / Frappe users who need a professional UI without replacing the entire Frappe frontend.

---

## 2. Problem Statement

Default Frappe Desk has three systemic issues:

| Problem | Impact |
|---------|--------|
| No design system — scattered hardcoded values (colors, fonts, spacing) | Hard to maintain; inconsistent across views |
| Cramped, unstructured forms — no visual hierarchy | Users struggle to scan forms; slower data entry |
| Generic appearance — no brand character | Feels like raw Frappe; not suitable for client-facing deployments |

---

## 3. Goals

1. **Design system** — all typography, color, and spacing driven by CSS custom properties
2. **Form UX** — clear visual hierarchy (section headers, labels, spacing) matching HubSpot/Salesforce modern standard
3. **Modern theme** — Stripe-style `light_stripe` theme covering list view, form view, and dashboard
4. **Zero regression** — dark themes (cosmic_ocean, aurora_borealis, etc.) remain fully intact

---

## 4. Non-Goals

- Replacing Frappe's Python backend
- Building a component library or bundled frontend
- Changing notification dropdown, command palette, print format, or report builder
- Mobile/responsive adjustments
- Dark theme redesign

---

## 5. Architecture Constraints

| Constraint | Reason |
|-----------|--------|
| Vanilla JS only — no bundler | Frappe serves assets directly from `public/` |
| CSS `!important` required | Must override Frappe's bundled specificity |
| Never touch Frappe core files | Override via DOM manipulation or CSS specificity only |
| All tokens as CSS custom properties | Enable per-theme overrides via `[data-vd-theme]` attribute |

---

## 6. Feature Requirements

### 6.1 Typography Scale

**Goal:** Replace all hardcoded font-size values with a 7-token scale.

**Token system** (base: `html { font-size: 13px }`):

| Token | rem | px | Use |
|-------|-----|----|-----|
| `--fs-2xs` | 0.6875rem | 8.9px | Badge, status tag, tiny label |
| `--fs-xs` | 0.75rem | 9.75px | Timestamp, breadcrumb, meta |
| `--fs-sm` | 0.875rem | 11.4px | Nav item, table header, button |
| `--fs-base` | 1rem | 13px | Body text, table row, input |
| `--fs-lg` | 1.125rem | 14.6px | Section title, card heading |
| `--fs-xl` | 1.25rem | 16.3px | Page title (h1) |
| `--fs-2xl` | 1.5rem | 19.5px | KPI number, hero stat |

**Line-height tokens:**

| Token | Value | Use |
|-------|-------|-----|
| `--lh-tight` | 1.2 | Headings |
| `--lh-snug` | 1.375 | Nav, compact elements |
| `--lh-normal` | 1.5 | Body text |

**Acceptance criteria:**
- Zero hardcoded rem/px font-size values remain in `vernon_desk.css` (except `html` base-size rules)
- All 20+ existing font-size values migrated to tokens
- Responsive breakpoints (1440px, 1920px) preserved — tokens scale automatically

---

### 6.2 Form UX Polish

**Goal:** CSS-only polish for DocType forms and dialogs.

**Section headers (`.form-section .section-head`):**
- Left accent stripe: `3px solid var(--vd-accent, #6b5b95)`
- Background: `#f9fafb`
- Title: uppercase, `font-weight: 700`, `letter-spacing: 0.06em`, `--fs-xs`

**Field labels (`.control-label`, `label`):**
- `text-transform: uppercase`
- `letter-spacing: 0.05em`
- `color: #64748b`
- `font-weight: 700`

**Section body (`.section-body`):**
- `padding: 16px`
- Field `margin-bottom: 4px`
- Column gutter: `padding: 0 8px`

**Modal/Dialog:**
- `border-radius: 12px`, `box-shadow` premium
- Header: `background: #f9fafb`, `padding: 14px 20px`, bottom divider
- Close button: 28px × 28px, `border-radius: 8px`, `#f1f5f9` bg
- Body: `padding: 20px`
- Footer: `background: #f9fafb`, top divider

**Acceptance criteria:**
- Section headers visually distinct with left purple stripe
- Labels uppercase, readable, not clashing with nav labels
- Dialog feels premium vs. default Bootstrap modal
- No regression in nav1/nav2, list view, or DataTable

---

### 6.3 Modern UI Deep Polish — `light_stripe` Theme

**Goal:** Stripe-style light mode theme as a new selectable option in Vernon Desk Settings.

#### Theme tokens (`[data-vd-theme="light_stripe"]`):

| Token | Value |
|-------|-------|
| `--vd-page-bg` | `#f6f8fa` |
| `--vd-card-bg` | `#ffffff` |
| `--vd-text` | `#24292f` |
| `--vd-text-muted` | `#6e7781` |
| `--vd-accent` | `#0969da` |
| `--vd-border` | `#e1e4e8` |

#### 6.3.1 List View

| Element | Requirement |
|---------|-------------|
| Column headers | Sticky, `#f6f8fa` bg, 11px uppercase muted |
| Default row | `#ffffff` bg |
| Row hover | `#f0f6ff` bg + `border-left: 3px solid #0969da` |
| Status badges | Semantic colors (Open=blue, Submitted=green, Draft=yellow, Cancelled=red) |
| Bulk action bar | JS-injected, appears on ≥1 checkbox selection, shows count + Clear |
| Empty state | JS-injected when 0 rows: icon + heading + subtext |
| Pagination | Compact: active page = solid `#0969da`, bordered buttons |

#### 6.3.2 Form View

| Element | Requirement |
|---------|-------------|
| Form sections | White card, `border: 1px solid #e1e4e8`, `border-radius: 8px` |
| Section header | 11px uppercase muted, no accent stripe (distinct from dark themes) |
| Field labels | 11px uppercase, `#6e7781`, `letter-spacing: .06em` |
| Mandatory asterisk | JS-injected `<span style="color:#cf222e">*</span>` on `reqd: 1` fields |
| Input fields | `border: 1px solid #d0d7de`, `border-radius: 6px`; focus = blue ring |
| Child table | Gray header, compact rows, outline "+ Add Row" in `#0969da` |
| Primary button | `background: #0969da` |
| Sticky save bar | JS-injected, fixed bottom, shows when `cur_frm.is_dirty()` = true |

#### 6.3.3 Dashboard / Workspace

| Element | Requirement |
|---------|-------------|
| KPI cards | White + `border: 1px solid #e1e4e8`, `border-radius: 8px`, no shadow |
| KPI label | 11px uppercase muted, `margin-bottom: 6px` |
| KPI metric | 22px `font-weight: 700`, `font-variant-numeric: tabular-nums` |
| Chart container | White card with clean header, uniform `#dbeafe` bars, active bar `#0969da` |
| Link widget cards | White, bordered |

**Acceptance criteria:**
- `light_stripe` selectable in Vernon Desk Settings → Theme dropdown
- All three areas (list/form/dashboard) render correctly with the theme
- Switch to `cosmic_ocean` → dark mode fully intact (zero regression)
- JS console has no uncaught errors navigating list → form → dashboard

---

## 7. Files Modified

| File | Change |
|------|--------|
| `vernon_desk/public/css/vernon_desk.css` | Typography tokens, form polish, light_stripe theme CSS |
| `vernon_desk/public/js/vernon_desk.js` | `initListEnhancements()`, `initFormEnhancements()` wired to `page-change` |
| `vernon_desk/vernon_desk/doctype/vernon_desk_settings/vernon_desk_settings.json` | Add `light_stripe` to theme Select field options |

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Hardcoded font-size values | 0 remaining |
| Dark theme regression | 0 broken selectors |
| JS console errors | 0 on navigation flow |
| Theme switch time | Instant (CSS-only token swap) |

---

## 9. Implementation Plan References

| Feature | Plan | Spec |
|---------|------|------|
| Typography Scale | `docs/superpowers/plans/2026-05-08-typography-scale.md` | `docs/superpowers/specs/2026-05-08-typography-scale-design.md` |
| Form UX Polish | `docs/superpowers/plans/2026-05-08-form-ux-polish.md` | `docs/superpowers/specs/2026-05-08-form-ux-polish-design.md` |
| Modern UI Deep Polish | `docs/superpowers/plans/2026-05-11-modern-ui-deep-polish.md` | `docs/superpowers/specs/2026-05-11-modern-ui-deep-polish-design.md` |

---

## 10. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Sidebar restructure (activity timeline, comments, attachments) — included in spec but not yet in plan | Not started |
| 2 | Filter bar chip UI (spec mentions pill chips for active filters) — not in current plan | Not started |
| 3 | Mini leaderboard widget — spec mentions but no plan task yet | Not started |
| 4 | Dashboard period switcher (pill group: This Month/Quarter/Year) — spec mentions, not in plan | Not started |

---

## 11. ERPNext Onboarding Guides (added 2026-06-15)

Visual onboarding for new ERPNext users: role-based **swimlane** desk Pages
that map the document workflow for **Sales**, **Purchase**, and **Stock**.
Each stage is a card that deep-links to the real ERPNext DocType (list / new
form / query report), so the guide both teaches the flow and launches work.

**Spec:** `docs/superpowers/specs/2026-06-15-onboarding-guides-design.md`

| Decision | Choice |
|----------|--------|
| Page type | Desk Pages under `/app` (`vernon-onboarding` hub + `sales-guide` / `purchase-guide` / `stock-guide`) |
| Stage data | Static + deep-link (no live queries) |
| Visual style | Swimlane per role (rows = role, columns = stage) |
| Restyle scope | New pages + shared tokens only — built on existing `--vd-*`, all 5 themes |

| File | Change |
|------|--------|
| `public/js/vernon_desk_guides_data.js` | NEW — pure WORKFLOWS config (data layer) |
| `public/js/vernon_desk_guides.js` | NEW — swimlane/hub renderer (view layer) |
| `public/css/vernon_desk_guides.css` | NEW — swimlane + hub styling, themed via `--vd-*` |
| `vernon_desk/page/{vernon_onboarding,sales_guide,purchase_guide,stock_guide}/` | NEW — 4 desk Pages |
| `public/css/vernon_desk.css` | Add `--vd-on-accent` to aurora theme (badge contrast) |
| `hooks.py` | Wire guide data/view JS + CSS into `app_include_*` |
| `tests/test_guides.py` | NEW — Page-record + data-model integrity tests |

**Acceptance:**
- `/app/vernon-onboarding` shows 3 cards → each opens its workflow guide
- Each guide renders a 3-lane swimlane; every node routes to its ERPNext DocType
- Renders correctly across all 5 Vernon Desk themes (no dark-theme regression)
- `tests/test_guides.py` green; no JS console errors on navigation

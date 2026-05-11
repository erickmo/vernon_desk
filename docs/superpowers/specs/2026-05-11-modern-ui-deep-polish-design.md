# Vernon Desk — Modern UI Deep Polish

**Date:** 2026-05-11  
**Status:** Approved  
**Approach:** Deep Polish — CSS + JS  
**Reference:** Stripe Dashboard (light mode)

---

## Scope

Three areas, delivered in one PR:

1. **List / Table View**
2. **Form View**
3. **Dashboard**

---

## Design Principles

- Light mode primary: `#f6f8fa` page bg, `#ffffff` card bg, `#24292f` text
- Typography: Inter, uppercase muted labels (`#6e7781`, 11px, `letter-spacing: .06em`)
- Border: `1px solid #e1e4e8` — consistent across all containers
- Border-radius: 8px cards, 6px inputs/buttons, 20px badges
- Accent blue: `#0969da` (Stripe blue) — links, active states, primary buttons
- Tabular numbers: `font-variant-numeric: tabular-nums` on all numeric cells

---

## 1. List / Table View

### Filter Bar (JS inject)
- Bar sits above the table, white bg, `border-bottom: 1px solid #e1e4e8`
- Active filters render as **pill chips**: colored bg matching filter type, `×` to remove
- "+ Add filter" link in accent blue
- Result count right-aligned: `"24 results"`, 12px muted

### Column Headers (CSS)
- Sticky on scroll (`position: sticky; top: 0; z-index: 10`)
- Background `#f6f8fa`, `border-bottom: 1px solid #e1e4e8`
- Text: 11px, `font-weight: 600`, uppercase, `letter-spacing: .06em`, color `#6e7781`

### Row States (CSS)
- Default: `background: #fff`
- Hover: `background: #f0f6ff`, `border-left: 3px solid #0969da`
- Selected (checkbox checked): same as hover + checkbox `accent-color: #0969da`

### Status Badges (CSS)
Rounded pill `border-radius: 20px`, 11px, `font-weight: 600`, 2px 8px padding:

| Status | Background | Text |
|--------|-----------|------|
| Open | `#dbeafe` | `#1d4ed8` |
| Submitted | `#dcfce7` | `#15803d` |
| Draft | `#fef9c3` | `#854d0e` |
| Cancelled | `#fee2e2` | `#b91c1c` |

### Bulk Action Bar (JS inject)
- Appears at top when ≥1 row selected
- Shows count + actions (Delete, Export, etc.)
- Dismissed when selection cleared

### Pagination (CSS)
- Compact: `"Showing 1–20 of 24"` left, page buttons right
- Active page: solid `#0969da` bg + white text
- Buttons: `border: 1px solid #e1e4e8`, `border-radius: 6px`, 12px

### Empty State (JS inject)
- Centered: icon placeholder + heading + subtext + CTA button
- Only rendered when Frappe list returns 0 rows

---

## 2. Form View

### Layout (CSS)
- Two-column: main form left (flexible) + sidebar right (260px fixed)
- Page bg `#f6f8fa`, form cards `#fff` with `border: 1px solid #e1e4e8; border-radius: 8px`

### Section Cards (CSS)
- Each form section = card with header `border-bottom: 1px solid #f0f0f0`
- Section header: 11px uppercase muted label, no accent stripe in light mode
- Field labels: 11px uppercase, `letter-spacing: .06em`, `color: #6e7781`
- Mandatory asterisk: `<span style="color:#cf222e">*</span>` appended to label (JS inject)

### Child Table (CSS)
- Header row: `background: #f6f8fa`, uppercase muted column labels
- Data rows: compact 8px vertical padding, `border-bottom: 1px solid #f0f0f0`
- Total row: `font-weight: 700`, no bottom border
- "+ Add Row" button: top-right of child table header, outline style `border: 1px solid #0969da`

### Sidebar Panel (JS restructure)
Right sidebar (260px) consolidates three Frappe panels:
1. **Activity timeline** — avatar circle (initials) + left-border connector + timestamp
2. **Comment box** — textarea + Submit button, `border: 1px solid #d0d7de; border-radius: 6px`
3. **Attachments** — file chips (icon + name + size) + dashed "+ Attach file" button

### Sticky Save Bar (JS inject)
- Fixed to bottom of viewport when form has unsaved changes
- `background: #fff; border-top: 1px solid #e1e4e8`
- Left: "Unsaved changes" 12px muted text
- Right: "Discard" (outline) + "Save" (solid `#0969da`) buttons
- Hides when no changes pending

### Breadcrumb Status Badge (CSS)
- Status badge rendered inline next to document name in breadcrumb area

---

## 3. Dashboard

### Dashboard Header (CSS)
- White bar, `border-bottom: 1px solid #e1e4e8`
- Left: title (15px bold) + "Last updated X min ago" (12px muted)
- Right: **Period switcher** — pill group (This Month / Quarter / Year), active = solid `#0969da`

### KPI Cards (CSS)
Grid of 4 cards, each:
- Label: 11px uppercase muted, `margin-bottom: 6px`
- Metric: 22px `font-weight: 700`, tabular nums
- Trend row: arrow + delta % colored green (`#16a34a`) or red (`#dc2626`) + "vs last month" muted
- Special: overdue count as red pill badge instead of trend

### Chart Container (CSS)
- `background: #fff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px`
- Header: chart title (12px bold) + date range (11px muted), `margin-bottom: 12px`
- Chart bars: uniform `#dbeafe`, active/current bar `#0969da`
- Week labels: 10px muted below bars

### Mini Leaderboard (CSS)
- Avatar: 24px circle, initials, colored bg per item (blue/green/yellow cycling)
- Name: 12px regular
- Amount: 12px bold tabular right-aligned
- Row separator: `border-bottom: 1px solid #f0f0f0`

---

## Implementation Notes

### CSS changes
- Add light mode token block (new theme: `light-stripe`)
- Override list, form, dashboard selectors scoped to `[data-theme="light-stripe"]` or as global Frappe overrides if theme switching not yet supported
- All existing dark themes must remain unaffected — scope new rules carefully

### JS changes
- `vernon_desk.js`: add `initListEnhancements()` — filter chips, bulk bar, empty state
- `vernon_desk.js`: add `initFormEnhancements()` — sidebar restructure, sticky save bar, mandatory asterisks
- All JS DOM manipulation runs after `frappe.router.on('change')` to survive navigation

### Files touched
- `vernon_desk/public/css/vernon_desk.css`
- `vernon_desk/public/js/vernon_desk.js`

### Out of scope
- Notification dropdown
- Command palette (Ctrl+K)
- Print format
- Report builder
- Dark theme changes

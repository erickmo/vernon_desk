# Typography Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 20 hardcoded font-size values in `vernon_desk.css` with a 7-token CSS custom property scale (`--fs-2xs` through `--fs-2xl`) plus 3 line-height tokens.

**Architecture:** Single-file CSS change. Add tokens to `:root`, then do a targeted find-and-replace of every hardcoded `font-size` value. No JS changes. No build step. Base `html { font-size: 13px }` unchanged.

**Tech Stack:** Vanilla CSS, Frappe framework (asset served directly from `public/css/`).

---

## Files

- Modify: `vernon_desk/public/css/vernon_desk.css`
  - `:root` block (lines 5–13): add 10 new tokens
  - Lines 165, 170, 176, 185, 218, 269, 283, 306, 319, 371, 390, 404, 412, 413, 460, 474, 493, 502, 515, 525, 543: replace hardcoded values

---

## Task 1: Add Token Definitions to `:root`

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css:5-13`

- [ ] **Step 1: Open the file and locate the `:root` block**

  Current block (lines 5–13):
  ```css
  :root {
      --vd-nav1-height:    48px;
      --vd-navmain-height: 40px;
      --vd-nav2-height:    32px;
      --vd-total-nav:      calc(var(--vd-nav1-height) + var(--vd-navmain-height) + var(--vd-nav2-height));
      --vd-font:           'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --vd-ease:           cubic-bezier(0.4, 0, 0.2, 1);
      --vd-radius:         8px;
  }
  ```

- [ ] **Step 2: Replace `:root` block with tokens added**

  ```css
  :root {
      --vd-nav1-height:    48px;
      --vd-navmain-height: 40px;
      --vd-nav2-height:    32px;
      --vd-total-nav:      calc(var(--vd-nav1-height) + var(--vd-navmain-height) + var(--vd-nav2-height));
      --vd-font:           'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --vd-ease:           cubic-bezier(0.4, 0, 0.2, 1);
      --vd-radius:         8px;

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
  }
  ```

- [ ] **Step 3: Verify tokens are parseable**

  Run: `grep -c "fs-2xs\|fs-xs\|fs-sm\|fs-base\|fs-lg\|fs-xl\|fs-2xl\|lh-tight\|lh-snug\|lh-normal" vernon_desk/public/css/vernon_desk.css`

  Expected output: `10` (10 token definitions in `:root`)

- [ ] **Step 4: Commit**

  ```bash
  git add vernon_desk/public/css/vernon_desk.css
  git commit -m "feat(css): add typography token definitions to :root"
  ```

---

## Task 2: Replace Nav-Layer Font Sizes (lines 165–283)

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css`

Covers: navbar links, badge, logo text, logo mark, nav-main trigger, dropdown items, dropdown icon.

- [ ] **Step 1: Replace line 165 — navbar nav link**

  Old: `font-size: 0.78rem !important;`
  New: `font-size: var(--fs-sm) !important;`

- [ ] **Step 2: Replace line 170 — navbar badge**

  Old: `font-size: 0.65rem !important; }`
  New: `font-size: var(--fs-2xs) !important; }`

- [ ] **Step 3: Replace line 176 — logo text**

  Old: `font-weight: 700; font-size: 0.85rem;`
  New: `font-weight: 700; font-size: var(--fs-sm);`

- [ ] **Step 4: Replace line 185 — logo mark icon**

  Old: `font-size: 11px; font-weight: 800;`
  New: `font-size: var(--fs-2xs); font-weight: 800;`

- [ ] **Step 5: Replace line 218 — nav-main trigger**

  Old: `font-size: 0.78rem; font-weight: 500;`
  New: `font-size: var(--fs-sm); font-weight: 500;`

- [ ] **Step 6: Replace line 269 — dropdown item**

  Old: `font-size: 0.78rem; font-weight: 450;`
  New: `font-size: var(--fs-sm); font-weight: 450;`

- [ ] **Step 7: Replace line 283 — dropdown icon**

  Old: `font-size: 0.85rem; line-height: 1; opacity: 0.70; }`
  New: `font-size: var(--fs-sm); line-height: 1; opacity: 0.70; }`

- [ ] **Step 8: Verify — no raw rem values remain in nav section (lines 160–290)**

  Run: `awk 'NR>=160 && NR<=290' vernon_desk/public/css/vernon_desk.css | grep "font-size" | grep -v "var(--fs"`

  Expected output: empty (no hardcoded font-size left in nav section)

- [ ] **Step 9: Commit**

  ```bash
  git add vernon_desk/public/css/vernon_desk.css
  git commit -m "feat(css): migrate nav-layer font-sizes to --fs-* tokens"
  ```

---

## Task 3: Replace Nav2 Font Sizes (lines 305–325)

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css`

Covers: nav2 label, nav2 item.

- [ ] **Step 1: Replace line 306 — nav2 label**

  Old: `font-size: 0.65rem; font-weight: 700;`
  New: `font-size: var(--fs-2xs); font-weight: 700;`

- [ ] **Step 2: Replace line 319 — nav2 item**

  Old: `font-size: 0.74rem; font-weight: 450;`
  New: `font-size: var(--fs-xs); font-weight: 450;`

- [ ] **Step 3: Verify — no raw rem values remain in nav2 section (lines 289–340)**

  Run: `awk 'NR>=289 && NR<=340' vernon_desk/public/css/vernon_desk.css | grep "font-size" | grep -v "var(--fs"`

  Expected output: empty

- [ ] **Step 4: Commit**

  ```bash
  git add vernon_desk/public/css/vernon_desk.css
  git commit -m "feat(css): migrate nav2 font-sizes to --fs-* tokens"
  ```

---

## Task 4: Replace Page-Level Font Sizes (lines 366–413)

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css`

Covers: page title (h1), form inputs, form labels, buttons (xs/sm).

- [ ] **Step 1: Replace line 371 — page title**

  Old: `font-size: clamp(0.95rem, 1.2vw, 1.15rem) !important;`
  New: `font-size: var(--fs-xl) !important;`

- [ ] **Step 2: Replace line 390 — form-control input**

  Old: `font-size: 0.82rem !important;`
  New: `font-size: var(--fs-sm) !important;`

- [ ] **Step 3: Replace line 404 — form label**

  Old: `font-size: 0.75rem !important;`
  New: `font-size: var(--fs-xs) !important;`

- [ ] **Step 4: Replace line 412 — btn-xs**

  Old: `.btn-xs { font-size: 0.70rem !important; }`
  New: `.btn-xs { font-size: var(--fs-xs) !important; }`

- [ ] **Step 5: Replace line 413 — btn-sm**

  Old: `.btn-sm { font-size: 0.75rem !important; }`
  New: `.btn-sm { font-size: var(--fs-xs) !important; }`

- [ ] **Step 6: Verify — no raw rem values remain in page-level section (lines 360–450)**

  Run: `awk 'NR>=360 && NR<=450' vernon_desk/public/css/vernon_desk.css | grep "font-size" | grep -v "var(--fs"`

  Expected output: empty

- [ ] **Step 7: Commit**

  ```bash
  git add vernon_desk/public/css/vernon_desk.css
  git commit -m "feat(css): migrate page-level font-sizes to --fs-* tokens"
  ```

---

## Task 5: Replace Data-Layer Font Sizes (lines 454–543)

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css`

Covers: table thead, Frappe DataTable header, list-row-head, list-row, indicator-pill, breadcrumb, search input.

- [ ] **Step 1: Replace line 460 — HTML table thead**

  Old: `font-size: 0.68rem !important;`  (inside `.page-body table thead tr th`)
  New: `font-size: var(--fs-2xs) !important;`

- [ ] **Step 2: Replace line 474 — Frappe DataTable header**

  Old: `font-size: 0.68rem !important;`  (inside `.dt-header .dt-cell--header, .dt-header .dt-cell`)
  New: `font-size: var(--fs-2xs) !important;`

- [ ] **Step 3: Replace line 493 — list-row-head columns**

  Old: `font-size: 0.68rem !important;`  (inside `.list-row-head .list-subject-field`)
  New: `font-size: var(--fs-2xs) !important;`

- [ ] **Step 4: Replace line 502 — list-row body**

  Old: `font-size: 0.82rem !important;`
  New: `font-size: var(--fs-sm) !important;`

- [ ] **Step 5: Replace line 515 — indicator-pill**

  Old: `font-size: 0.68rem !important;`
  New: `font-size: var(--fs-2xs) !important;`

- [ ] **Step 6: Replace line 525 — breadcrumb**

  Old: `font-size: 0.74rem !important;`
  New: `font-size: var(--fs-xs) !important;`

- [ ] **Step 7: Replace line 543 — search input**

  Old: `font-size: 0.78rem !important;`
  New: `font-size: var(--fs-sm) !important;`

- [ ] **Step 8: Verify — zero hardcoded font-size rem values remain in entire file**

  Run: `grep "font-size:" vernon_desk/public/css/vernon_desk.css | grep -v "var(--fs" | grep -v "12px\|12.5px\|13px"`

  Expected output: empty (only the 3 `html` base-size rules should remain, all others use tokens)

- [ ] **Step 9: Commit**

  ```bash
  git add vernon_desk/public/css/vernon_desk.css
  git commit -m "feat(css): migrate data-layer font-sizes to --fs-* tokens"
  ```

---

## Task 6: Visual Verification

**Files:** None (read-only verification)

- [ ] **Step 1: Reload Frappe dev server**

  Run: `bench restart` (or Ctrl+C and restart if running foreground)

- [ ] **Step 2: Hard-refresh browser** (`Cmd+Shift+R` / `Ctrl+Shift+R`)

- [ ] **Step 3: Check each element visually**

  Open any List View (e.g., Purchase Order). Verify:
  - [ ] Page title visible and larger than nav items
  - [ ] Table headers: small, uppercase, readable
  - [ ] Table rows: legible body text
  - [ ] Status badges: compact but readable
  - [ ] Breadcrumb: smaller than body text
  - [ ] Form labels: slightly smaller than inputs
  - [ ] Buttons: consistent with nav items

- [ ] **Step 4: Check no visual regression in nav**

  Click through nav1 → nav2. Verify items are readable, active states work.

- [ ] **Step 5: Final commit if any visual tweaks needed**

  After any minor adjustments:
  ```bash
  git add vernon_desk/public/css/vernon_desk.css
  git commit -m "fix(css): visual tweaks after typography token migration"
  ```

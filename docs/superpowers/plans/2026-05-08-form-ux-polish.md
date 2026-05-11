# Form UI/UX Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish DocType form and dialog UI via CSS-only changes — stronger section headers, better field spacing, and premium dialog styling.

**Architecture:** Pure CSS overrides in `vernon_desk/public/css/vernon_desk.css`. No JS, no Frappe core changes. All rules use `!important` to override Frappe's bundled styles. Changes are additive: modify existing rules in-place or append new blocks at the end of the file.

**Tech Stack:** Vanilla CSS, Frappe v15 DOM selectors

**Spec:** `docs/superpowers/specs/2026-05-08-form-ux-polish-design.md`

---

## Files Modified

| File | Change |
|------|--------|
| `vernon_desk/public/css/vernon_desk.css` | Modify lines 401–402, 435–441; add new blocks after line 417 and at end of file |

---

## Task 1: Section Header Accent Stripe

**File:** `vernon_desk/public/css/vernon_desk.css`

**Context:** Line 401–402 already sets font-size `--fs-lg` for `.page-content .section-head`. We override this for form-specific section heads and add the left accent border.

- [ ] **Step 1: Add section head rules after the `/* ── Cards */` block (after line 417)**

Open `vernon_desk/public/css/vernon_desk.css`. After line 417 (the closing `}` of the Cards block), insert:

```css
/* ── Section head: accent stripe ──────────────────────────── */
.form-section .section-head {
    border-left: 3px solid var(--vd-accent, #6b5b95) !important;
    background: #f9fafb !important;
    padding: 10px 16px !important;
    border-bottom: 1px solid #eef1f6 !important;
    border-radius: 0 !important;
}
.form-section .section-head .section-title {
    font-size: var(--fs-xs) !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    color: #374151 !important;
    line-height: var(--lh-tight) !important;
}
```

- [ ] **Step 2: Visual verify**

Open Frappe Desk (e.g. `http://localhost:8000`) → open any DocType form (e.g. Customer or Sales Order).

Check:
- Section header has visible purple left border (3px)
- Section header background is slightly off-white (#f9fafb)
- Section title text is uppercase with wider letter spacing
- Multiple sections each show the accent stripe

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): section head accent stripe and uppercase label"
```

---

## Task 2: Section Body + Field Spacing

**File:** `vernon_desk/public/css/vernon_desk.css`

**Context:** `.section-body` currently has card styling (border/shadow/bg) but no padding override. Fields inside are cramped. We add padding and vertical field gap.

- [ ] **Step 1: Add section body spacing rules immediately after the section head block from Task 1**

Append right after the `.form-section .section-head .section-title` closing `}`:

```css
/* ── Section body: breathing room ─────────────────────────── */
.section-body {
    padding: 16px !important;
}
.frappe-control {
    margin-bottom: 4px !important;
}
.section-columns .form-column {
    padding: 0 8px !important;
}
```

- [ ] **Step 2: Visual verify**

On the same form as Task 1:

Check:
- Fields inside a section have visible padding from the card edge (at least 16px)
- Vertical space between fields is comfortable — not cramped
- Two-column layout (if present) has visible gutter between columns

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): section body padding and field gap spacing"
```

---

## Task 3: Label Polish

**File:** `vernon_desk/public/css/vernon_desk.css`

**Context:** Existing `label, .control-label` rule is at lines 435–441. Modify it in-place: bump weight to 700, add uppercase, widen letter-spacing, darken to #64748b.

- [ ] **Step 1: Modify the existing label rule (lines 435–441)**

Replace:

```css
label, .control-label {
    font-family: var(--vd-font) !important;
    font-size: var(--fs-xs) !important;
    font-weight: 600 !important;
    color: #475569 !important;
    letter-spacing: 0.01em !important;
}
```

With:

```css
label, .control-label {
    font-family: var(--vd-font) !important;
    font-size: var(--fs-xs) !important;
    font-weight: 700 !important;
    color: #64748b !important;
    letter-spacing: 0.05em !important;
    text-transform: uppercase !important;
}
```

- [ ] **Step 2: Visual verify**

On the same form:

Check:
- Field labels are clearly uppercase
- Labels are slightly darker and crisper than before
- Labels do not overlap or clip (if any label is very long, check truncation is graceful)
- Nav labels (if any use `.control-label`) are not adversely affected — if they are, scope the rule to `.form-section label, .form-section .control-label` instead

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): uppercase field labels with tighter weight and spacing"
```

---

## Task 4: Dialog / Modal Polish

**File:** `vernon_desk/public/css/vernon_desk.css`

**Context:** No modal styles exist yet. Frappe v15 dialogs use Bootstrap modal classes (`.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`, `.modal-title`) plus Frappe's own `.modal-header .close` or `[data-dismiss="modal"]` for close. Append a new block at the end of the file.

- [ ] **Step 1: Append modal rules at the end of the file (after line 588)**

```css

/* ── Modal / Dialog ────────────────────────────────────────── */
.modal-content {
    font-family: var(--vd-font) !important;
    border-radius: 12px !important;
    border: 1px solid #e0e7f0 !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06) !important;
    overflow: hidden !important;
}
.modal-header {
    background: #f9fafb !important;
    padding: 14px 20px !important;
    border-bottom: 1px solid #eef1f6 !important;
    display: flex !important;
    align-items: center !important;
}
.modal-title {
    font-size: var(--fs-base) !important;
    font-weight: 700 !important;
    color: #1e293b !important;
    line-height: var(--lh-tight) !important;
}
.modal-header .close,
.modal-header [data-dismiss="modal"] {
    width: 28px !important;
    height: 28px !important;
    border-radius: 8px !important;
    background: #f1f5f9 !important;
    border: none !important;
    color: #64748b !important;
    opacity: 1 !important;
    font-size: 18px !important;
    line-height: 1 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background 0.1s var(--vd-ease), color 0.1s var(--vd-ease) !important;
}
.modal-header .close:hover,
.modal-header [data-dismiss="modal"]:hover {
    background: #e2e8f0 !important;
    color: #374151 !important;
}
.modal-body {
    padding: 20px !important;
}
.modal-footer {
    background: #f9fafb !important;
    padding: 12px 20px !important;
    border-top: 1px solid #eef1f6 !important;
}
```

- [ ] **Step 2: Visual verify**

Open any "New" dialog or Quick Entry in Frappe (e.g. click "New" button on a list view, or use the Quick Entry shortcut).

Check:
- Dialog has rounded corners (12px radius)
- Header is off-white (#f9fafb) with a bottom divider line
- Title is bold (#1e293b)
- Close button is a rounded square, not the default Bootstrap ×
- Body has 20px padding on all sides — fields are not touching edges
- Footer is off-white with a top divider
- Save/Cancel buttons render correctly (already styled from existing button rules)

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): modal/dialog polish — header bg, rounded close, footer bg"
```

---

## Task 5: Regression Check

- [ ] **Step 1: Check nav1/nav2 not affected**

Open Frappe Desk home. Verify:
- Nav bar items have no unexpected uppercase transformation (if label rule was scoped to `.form-section` in Task 3, this is guaranteed — if not, check here)
- Nav2 submenu renders normally

- [ ] **Step 2: Check list view**

Open any list view (e.g. Customer list). Verify:
- Table headers still dark slate with white text
- Row hover still shows
- No extra padding or spacing anomalies in list rows

- [ ] **Step 3: Check DataTable**

Open a DocType with a child table in the form (e.g. Sales Order). Verify:
- DataTable header still dark slate
- Child table rows render normally
- No gap/padding overflow pushing child table outside card

- [ ] **Step 4: Final commit (if no issues)**

```bash
git log --oneline -5
```

All 4 feature commits should appear. If any regression was found and fixed, commit the fix:

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "fix(css): scope label uppercase to form-section to prevent nav regression"
```

---

## Known Risk: Label Scope

The `label, .control-label` selector in Task 3 is broad — it applies globally. If the uppercase treatment bleeds into nav or other UI elements, narrow the selector to:

```css
.form-section label,
.form-section .control-label,
.modal-body label,
.modal-body .control-label {
    ...
}
```

Check Task 5 Step 1 specifically for this. Fix inline if regression found.

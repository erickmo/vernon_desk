# Modern UI Deep Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe-style light mode (`light_stripe` theme) to Vernon Desk covering list view, form view, and dashboard — CSS + targeted JS enhancements.

**Architecture:** New CSS theme block `[data-vd-theme="light_stripe"]` defines light-mode tokens. Area-specific CSS overrides scoped to that selector. Two new JS methods (`initListEnhancements`, `initFormEnhancements`) injected into the `vernon_desk` object and called on every `page-change`. No bundler — files are served directly by Frappe.

**Tech Stack:** Vanilla CSS (custom properties), Vanilla JS (DOM manipulation), Frappe v15 (Python/JS hooks), `bench restart` to reload assets.

---

## File Map

| File | Change |
|------|--------|
| `vernon_desk/public/css/vernon_desk.css` | Add light-stripe theme block + list/form/dashboard overrides |
| `vernon_desk/public/js/vernon_desk.js` | Add `initListEnhancements()`, `initFormEnhancements()`, wire to `page-change` |
| `vernon_desk/vernon_desk/doctype/vernon_desk_settings/vernon_desk_settings.json` | Add `light_stripe` option to theme Select field |

---

## How to reload during development

```bash
# After every CSS/JS edit — no bench restart needed for assets:
# Hard-refresh browser: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

# After editing Python or DocType JSON:
bench restart
```

---

## Task 1: Add `light_stripe` to theme settings

**Files:**
- Modify: `vernon_desk/vernon_desk/doctype/vernon_desk_settings/vernon_desk_settings.json`

- [ ] **Step 1: Open the DocType JSON and find the `theme` field options**

```bash
grep -n "cosmic_ocean\|theme" \
  vernon_desk/vernon_desk/doctype/vernon_desk_settings/vernon_desk_settings.json \
  | head -20
```

- [ ] **Step 2: Add `light_stripe` option to the Select field**

Find the `options` string for the `theme` field. It looks like:
```
"options": "cosmic_ocean\naurora_borealis\nsunset_dusk\nmidnight_sapphire"
```
Change it to:
```
"options": "cosmic_ocean\naurora_borealis\nsunset_dusk\nmidnight_sapphire\nlight_stripe"
```

- [ ] **Step 3: Reload the DocType**

```bash
bench --site [your-site] migrate
```

Expected: No errors. Vernon Desk Settings form now shows `light_stripe` in theme dropdown.

- [ ] **Step 4: Set theme to light_stripe via settings**

In Frappe Desk → Vernon Desk Settings → Theme → select `light_stripe` → Save.

- [ ] **Step 5: Commit**

```bash
git add vernon_desk/vernon_desk/doctype/vernon_desk_settings/vernon_desk_settings.json
git commit -m "feat(settings): add light_stripe theme option"
```

---

## Task 2: CSS — Light-stripe token block + base overrides

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css` (append after the last theme block, before `/* ── Sidebar: gone`)

- [ ] **Step 1: Append the light-stripe token block**

Add after the `[data-vd-theme="midnight_sapphire"]` closing brace:

```css
/* ── Theme: Light Stripe ───────────────────────────────────── */
[data-vd-theme="light_stripe"] {
    --vd-grad:          #f6f8fa;
    --vd-nav-bg:        rgba(255, 255, 255, 0.95);
    --vd-nav-solid:     #24292f;
    --vd-navmain-bg:    #ffffff;
    --vd-navmain-solid: #24292f;
    --vd-nav2-solid:    #57606a;
    --vd-orb1:          transparent;
    --vd-orb2:          transparent;
    --vd-accent:        #0969da;
    --vd-accent2:       #1d4ed8;
    --vd-tint:          rgba(9, 105, 218, 0.06);
    --vd-logo-color:    #0969da;
    --vd-border:        #e1e4e8;
    --vd-text:          #24292f;
    --vd-text-muted:    #6e7781;
    --vd-card-bg:       #ffffff;
    --vd-page-bg:       #f6f8fa;
}

/* Base overrides — light mode only */
[data-vd-theme="light_stripe"] body {
    background: var(--vd-page-bg) !important;
    color: var(--vd-text) !important;
}
[data-vd-theme="light_stripe"] .layout-main-section,
[data-vd-theme="light_stripe"] .page-content {
    background: transparent !important;
}
[data-vd-theme="light_stripe"] .vd-orb { display: none !important; }
[data-vd-theme="light_stripe"] .navbar {
    border-bottom: 1px solid var(--vd-border) !important;
    box-shadow: none !important;
}
[data-vd-theme="light_stripe"] #vd-nav-main {
    border-bottom: 1px solid var(--vd-border) !important;
    box-shadow: none !important;
}
[data-vd-theme="light_stripe"] #vd-nav2 {
    border-bottom: 1px solid var(--vd-border) !important;
    background: #ffffff !important;
}
```

- [ ] **Step 2: Verify in browser**

Hard-refresh. With theme set to `light_stripe`:
- Page background should be `#f6f8fa` (light gray)
- Navbar should be white with bottom border (no glow)
- No ambient orbs visible
- Nav text should be dark

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): add light_stripe theme token block and base overrides"
```

---

## Task 3: CSS — List view overrides

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css` (append after existing `/* ── List rows` section)

- [ ] **Step 1: Append list view CSS**

```css
/* ── Light stripe: List view ───────────────────────────────── */
[data-vd-theme="light_stripe"] .list-row-container,
[data-vd-theme="light_stripe"] .result-list .list-row {
    background: #ffffff !important;
    border-bottom: 1px solid #e1e4e8 !important;
}
[data-vd-theme="light_stripe"] .list-row:hover,
[data-vd-theme="light_stripe"] .list-row-container:hover .list-row {
    background: #f0f6ff !important;
    border-left: 3px solid #0969da !important;
}
[data-vd-theme="light_stripe"] .list-header {
    background: #f6f8fa !important;
    border-bottom: 1px solid #e1e4e8 !important;
    position: sticky !important;
    top: var(--vd-total-nav) !important;
    z-index: 10 !important;
}
[data-vd-theme="light_stripe"] .list-header .list-col,
[data-vd-theme="light_stripe"] .list-header .column-header {
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: .06em !important;
    color: #6e7781 !important;
}
[data-vd-theme="light_stripe"] .list-row input[type="checkbox"],
[data-vd-theme="light_stripe"] .list-header input[type="checkbox"] {
    accent-color: #0969da !important;
}
[data-vd-theme="light_stripe"] .list-row .list-subject-field a,
[data-vd-theme="light_stripe"] .list-row .list-row-col .bold {
    color: #0969da !important;
    font-weight: 500 !important;
}
[data-vd-theme="light_stripe"] .indicator-pill.blue,
[data-vd-theme="light_stripe"] .indicator-pill[data-status="Open"] {
    background: #dbeafe !important; color: #1d4ed8 !important;
    border: none !important;
}
[data-vd-theme="light_stripe"] .indicator-pill.green,
[data-vd-theme="light_stripe"] .indicator-pill[data-status="Submitted"] {
    background: #dcfce7 !important; color: #15803d !important;
    border: none !important;
}
[data-vd-theme="light_stripe"] .indicator-pill.yellow,
[data-vd-theme="light_stripe"] .indicator-pill[data-status="Draft"] {
    background: #fef9c3 !important; color: #854d0e !important;
    border: none !important;
}
[data-vd-theme="light_stripe"] .indicator-pill.red,
[data-vd-theme="light_stripe"] .indicator-pill[data-status="Cancelled"] {
    background: #fee2e2 !important; color: #b91c1c !important;
    border: none !important;
}
[data-vd-theme="light_stripe"] .list-pager {
    background: #ffffff !important;
    border-top: 1px solid #e1e4e8 !important;
    padding: 8px 16px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}
[data-vd-theme="light_stripe"] .list-pager .btn-pager {
    font-size: 12px !important;
    border: 1px solid #e1e4e8 !important;
    border-radius: 6px !important;
    background: #ffffff !important;
    color: #24292f !important;
    padding: 4px 10px !important;
}
[data-vd-theme="light_stripe"] .list-pager .btn-pager.active,
[data-vd-theme="light_stripe"] .list-pager .btn-pager:focus {
    background: #0969da !important;
    color: #ffffff !important;
    border-color: #0969da !important;
}
```

- [ ] **Step 2: Verify in browser**

Navigate to any list view (e.g., Sales Order list):
- Header row: light gray bg, uppercase muted column labels
- Data rows: white bg, hover = light blue bg + left blue border
- Status pills: semantic colors (blue/green/yellow/red)
- Pagination bar at bottom with compact buttons

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): light_stripe list view — headers, rows, badges, pagination"
```

---

## Task 4: CSS — Form view overrides

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css` (append after list section)

- [ ] **Step 1: Append form view CSS**

```css
/* ── Light stripe: Form view ───────────────────────────────── */
[data-vd-theme="light_stripe"] .form-section {
    background: #ffffff !important;
    border: 1px solid #e1e4e8 !important;
    border-radius: 8px !important;
    margin-bottom: 16px !important;
    overflow: hidden !important;
}
[data-vd-theme="light_stripe"] .section-head {
    background: #ffffff !important;
    border-bottom: 1px solid #f0f0f0 !important;
    padding: 10px 16px !important;
}
[data-vd-theme="light_stripe"] .section-head .section-head-content {
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: .07em !important;
    color: #6e7781 !important;
}
[data-vd-theme="light_stripe"] .section-head::before {
    display: none !important;
}
[data-vd-theme="light_stripe"] .frappe-control label.control-label,
[data-vd-theme="light_stripe"] .frappe-control .control-label {
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: .06em !important;
    color: #6e7781 !important;
}
[data-vd-theme="light_stripe"] .frappe-control input.form-control,
[data-vd-theme="light_stripe"] .frappe-control textarea.form-control,
[data-vd-theme="light_stripe"] .frappe-control select.form-control {
    border: 1px solid #d0d7de !important;
    border-radius: 6px !important;
    background: #ffffff !important;
    color: #24292f !important;
    font-size: 13px !important;
}
[data-vd-theme="light_stripe"] .frappe-control input.form-control:focus,
[data-vd-theme="light_stripe"] .frappe-control textarea.form-control:focus {
    border-color: #0969da !important;
    box-shadow: 0 0 0 3px rgba(9,105,218,.12) !important;
}
[data-vd-theme="light_stripe"] .grid-heading-row {
    background: #f6f8fa !important;
    border-bottom: 1px solid #e1e4e8 !important;
}
[data-vd-theme="light_stripe"] .grid-heading-row .grid-col {
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: .05em !important;
    color: #6e7781 !important;
}
[data-vd-theme="light_stripe"] .grid-row {
    border-bottom: 1px solid #f0f0f0 !important;
}
[data-vd-theme="light_stripe"] .grid-row:hover {
    background: #f8fafc !important;
}
[data-vd-theme="light_stripe"] .grid-footer .btn-open-row,
[data-vd-theme="light_stripe"] .grid-add-row {
    font-size: 12px !important;
    color: #0969da !important;
    border: 1px solid #0969da !important;
    border-radius: 6px !important;
    background: transparent !important;
    padding: 3px 10px !important;
}
[data-vd-theme="light_stripe"] .page-head .indicator-pill {
    font-size: 11px !important;
    font-weight: 600 !important;
    border-radius: 20px !important;
    padding: 2px 10px !important;
}
[data-vd-theme="light_stripe"] .page-actions .btn-primary {
    background: #0969da !important;
    border-color: #0969da !important;
    border-radius: 6px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
}
[data-vd-theme="light_stripe"] .page-actions .btn-secondary,
[data-vd-theme="light_stripe"] .page-actions .btn-default {
    background: #ffffff !important;
    border: 1px solid #d0d7de !important;
    color: #24292f !important;
    border-radius: 6px !important;
}
```

- [ ] **Step 2: Verify in browser**

Open any form (e.g., Sales Order):
- Form sections appear as white cards with light border
- Section headers are uppercase muted (no colored stripe)
- Field labels: 11px uppercase gray
- Child table: gray header row, compact data rows, blue "+ Add Row" button
- Primary button: Stripe blue

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): light_stripe form view — sections, inputs, child table, buttons"
```

---

## Task 5: CSS — Dashboard overrides

**Files:**
- Modify: `vernon_desk/public/css/vernon_desk.css` (append after form section)

- [ ] **Step 1: Append dashboard CSS**

```css
/* ── Light stripe: Dashboard ───────────────────────────────── */
[data-vd-theme="light_stripe"] .widget.number-widget-box,
[data-vd-theme="light_stripe"] .number-widget-box {
    background: #ffffff !important;
    border: 1px solid #e1e4e8 !important;
    border-radius: 8px !important;
    box-shadow: none !important;
}
[data-vd-theme="light_stripe"] .number-widget-box .widget-head .widget-title {
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: .07em !important;
    color: #6e7781 !important;
}
[data-vd-theme="light_stripe"] .number-widget-box .widget-body .number {
    font-size: 22px !important;
    font-weight: 700 !important;
    color: #24292f !important;
    font-variant-numeric: tabular-nums !important;
}
[data-vd-theme="light_stripe"] .dashboard-chart-wrapper,
[data-vd-theme="light_stripe"] .widget.chart-widget {
    background: #ffffff !important;
    border: 1px solid #e1e4e8 !important;
    border-radius: 8px !important;
    box-shadow: none !important;
}
[data-vd-theme="light_stripe"] .dashboard-chart-wrapper .chart-container {
    padding: 16px !important;
}
[data-vd-theme="light_stripe"] .widget.chart-widget .widget-head {
    border-bottom: 1px solid #f0f0f0 !important;
    padding: 10px 16px !important;
    background: #ffffff !important;
}
[data-vd-theme="light_stripe"] .widget.chart-widget .widget-head .widget-title {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: #24292f !important;
    text-transform: none !important;
}
[data-vd-theme="light_stripe"] .frappe-chart .bar path {
    fill: #dbeafe !important;
}
[data-vd-theme="light_stripe"] .frappe-chart .bar path:last-child {
    fill: #0969da !important;
}
[data-vd-theme="light_stripe"] .widget.links-widget-box {
    background: #ffffff !important;
    border: 1px solid #e1e4e8 !important;
    border-radius: 8px !important;
    box-shadow: none !important;
}
[data-vd-theme="light_stripe"] .widget.links-widget-box .widget-head {
    border-bottom: 1px solid #f0f0f0 !important;
    background: #ffffff !important;
}
[data-vd-theme="light_stripe"] div[card_name] {
    background: #ffffff !important;
    border: 1px solid #e1e4e8 !important;
    border-radius: 8px !important;
    box-shadow: none !important;
}
```

- [ ] **Step 2: Verify in browser**

Navigate to any Workspace/Dashboard:
- Number widget cards: white bg, clean border, large metric number, uppercase muted label
- Chart containers: white card, clean header
- Link widget cards: white, bordered
- No box-shadows (flat Stripe style)

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/css/vernon_desk.css
git commit -m "feat(css): light_stripe dashboard — KPI cards, chart containers, widgets"
```

---

## Task 6: JS — List enhancements (bulk bar, empty state)

**Files:**
- Modify: `vernon_desk/public/js/vernon_desk.js`

- [ ] **Step 1: Add `initListEnhancements` method**

Add after the `slug_to_title` method (before the closing `};`):

```javascript
/* ── List view enhancements ────────────────────────────────── */
initListEnhancements() {
    const route = frappe.get_route();
    if (!route || route[0] !== "List") return;
    setTimeout(() => {
        this._inject_empty_state();
        this._bind_bulk_bar();
    }, 300);
},

_inject_empty_state() {
    const noResult = document.querySelector(".no-result");
    if (!noResult || document.getElementById("vd-empty-state")) return;
    if (document.querySelectorAll(".list-row").length > 0) return;

    while (noResult.firstChild) noResult.removeChild(noResult.firstChild);

    const wrap = vd_el("div", { id: "vd-empty-state" });
    wrap.style.cssText = [
        "display:flex", "flex-direction:column", "align-items:center",
        "justify-content:center", "padding:60px 20px", "text-align:center",
    ].join(";");

    const icon = vd_el("div", {}, "📭");
    icon.style.cssText = "font-size:40px;margin-bottom:12px;";

    const heading = vd_el("p", {});
    heading.style.cssText = "font-size:15px;font-weight:600;color:#24292f;margin:0 0 6px;";
    heading.textContent = "No records found";

    const sub = vd_el("p", {});
    sub.style.cssText = "font-size:13px;color:#6e7781;margin:0 0 16px;";
    sub.textContent = "Try adjusting your filters or create a new record.";

    wrap.appendChild(icon);
    wrap.appendChild(heading);
    wrap.appendChild(sub);
    noResult.appendChild(wrap);
},

_bind_bulk_bar() {
    if (document.getElementById("vd-bulk-bar")) return;

    const bar = vd_el("div", { id: "vd-bulk-bar" });
    bar.style.cssText = [
        "display:none", "align-items:center", "gap:12px",
        "padding:8px 16px", "background:#0969da", "color:#fff",
        "font-family:var(--vd-font)", "font-size:13px",
        "position:sticky", "top:var(--vd-total-nav)", "z-index:20",
    ].join(";");

    const count = vd_el("span", { id: "vd-bulk-count" }, "0 selected");
    bar.appendChild(count);

    const clear = vd_el("button", {}, "Clear");
    clear.style.cssText = "background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:4px;padding:3px 10px;cursor:pointer;font-size:12px;";
    clear.onclick = () => {
        document.querySelectorAll(".list-row input[type='checkbox']:checked")
            .forEach(cb => cb.click());
    };
    bar.appendChild(clear);

    const pageContent = document.querySelector(".page-content");
    if (pageContent) pageContent.prepend(bar);

    document.addEventListener("change", (e) => {
        if (!e.target.matches(".list-row input[type='checkbox']")) return;
        const checked = document.querySelectorAll(
            ".list-row input[type='checkbox']:checked"
        ).length;
        if (checked > 0) {
            bar.style.display = "flex";
            document.getElementById("vd-bulk-count").textContent = `${checked} selected`;
        } else {
            bar.style.display = "none";
        }
    });
},
```

- [ ] **Step 2: Wire into `bind_route_change`**

In the existing `bind_route_change` method, add two calls inside the `page-change` handler:

```javascript
bind_route_change() {
    if (this._nav2_bound) return;
    this._nav2_bound = true;
    $(document).on("page-change", () => {
        const route = frappe.get_route();
        this.render_nav2(route);
        this._update_nm_active(route);
        this.initListEnhancements();  // ADD
        this.initFormEnhancements();  // ADD (defined in Task 7)
    });
    const r = frappe.get_route();
    this.render_nav2(r);
    this._update_nm_active(r);
},
```

- [ ] **Step 3: Verify in browser**

Navigate to any list view:
- Check a row → blue bulk bar appears at top showing "N selected" + Clear button
- Click Clear → bar hides, checkboxes unchecked
- Filter to 0 results → custom empty state (📭 + message) shows

- [ ] **Step 4: Commit**

```bash
git add vernon_desk/public/js/vernon_desk.js
git commit -m "feat(js): list enhancements — bulk action bar, empty state"
```

---

## Task 7: JS — Form enhancements (sticky save bar, mandatory asterisks)

**Files:**
- Modify: `vernon_desk/public/js/vernon_desk.js`

- [ ] **Step 1: Add `initFormEnhancements` method**

Add after `initListEnhancements` (before the closing `};`):

```javascript
/* ── Form view enhancements ────────────────────────────────── */
initFormEnhancements() {
    const route = frappe.get_route();
    if (!route || route[0] !== "Form") return;
    setTimeout(() => {
        this._inject_mandatory_asterisks();
        this._inject_sticky_save_bar();
    }, 400);
},

_inject_mandatory_asterisks() {
    if (!window.cur_frm || !cur_frm.fields_dict) return;
    Object.values(cur_frm.fields_dict).forEach(field => {
        if (!field.df || !field.df.reqd) return;
        const label = field.wrapper && field.wrapper.querySelector("label.control-label");
        if (!label || label.querySelector(".vd-req")) return;
        const asterisk = vd_el("span", { class: "vd-req" }, " *");
        asterisk.style.color = "#cf222e";
        label.appendChild(asterisk);
    });
},

_inject_sticky_save_bar() {
    if (document.getElementById("vd-save-bar")) return;

    const bar = vd_el("div", { id: "vd-save-bar" });
    bar.style.cssText = [
        "display:none", "position:fixed", "bottom:0", "left:0", "right:0",
        "background:#fff", "border-top:1px solid #e1e4e8",
        "padding:10px 24px", "z-index:1050",
        "align-items:center", "justify-content:space-between",
        "font-family:var(--vd-font)",
    ].join(";");

    const msg = vd_el("span", {}, "Unsaved changes");
    msg.style.cssText = "font-size:12px;color:#6e7781;";

    const btnWrap = vd_el("div", {});
    btnWrap.style.cssText = "display:flex;gap:8px;";

    const discardBtn = vd_el("button", {}, "Discard");
    discardBtn.style.cssText = [
        "font-size:13px", "background:#fff", "color:#6e7781",
        "border:1px solid #d0d7de", "border-radius:6px",
        "padding:6px 14px", "cursor:pointer",
    ].join(";");
    discardBtn.onclick = () => {
        if (window.cur_frm) cur_frm.discard_changes();
    };

    const saveBtn = vd_el("button", {}, "Save");
    saveBtn.style.cssText = [
        "font-size:13px", "background:#0969da", "color:#fff",
        "border:none", "border-radius:6px",
        "padding:6px 14px", "cursor:pointer", "font-weight:500",
    ].join(";");
    saveBtn.onclick = () => {
        if (window.cur_frm) cur_frm.save();
    };

    btnWrap.appendChild(discardBtn);
    btnWrap.appendChild(saveBtn);
    bar.appendChild(msg);
    bar.appendChild(btnWrap);
    document.body.appendChild(bar);

    this._save_bar_interval = setInterval(() => {
        if (window.cur_frm && cur_frm.is_dirty()) {
            bar.style.display = "flex";
        } else {
            bar.style.display = "none";
        }
    }, 500);

    $(document).one("page-change", () => {
        clearInterval(this._save_bar_interval);
        bar.remove();
    });
},
```

- [ ] **Step 2: Verify in browser**

Open any form and edit a field:
- Sticky save bar appears at bottom with "Unsaved changes" + Discard/Save
- Click Save → form saves, bar disappears
- Click Discard → changes reverted, bar disappears
- Mandatory fields (reqd: 1) show red `*` after label text

- [ ] **Step 3: Commit**

```bash
git add vernon_desk/public/js/vernon_desk.js
git commit -m "feat(js): form enhancements — sticky save bar, mandatory asterisks"
```

---

## Task 8: Final smoke test + cleanup

- [ ] **Step 1: Test all three areas with light_stripe theme active**

Checklist:
- [ ] List view: row hover = blue bg + left border, status badges colored correctly
- [ ] List view: check a row → bulk bar (blue) appears, Clear works
- [ ] List view: filter to 0 results → custom empty state shows (📭)
- [ ] Form view: sections appear as white cards, labels uppercase muted
- [ ] Form view: edit a field → sticky save bar appears at bottom
- [ ] Form view: Save button works, bar hides after save
- [ ] Form view: Discard button works
- [ ] Form view: mandatory fields show red `*`
- [ ] Form view: child table has gray header, compact rows, blue Add Row
- [ ] Dashboard/Workspace: KPI cards white+bordered, chart containers clean
- [ ] Switch to `cosmic_ocean` → dark mode fully intact (no regression)

- [ ] **Step 2: Check JS console for errors**

Open DevTools → Console. Navigate list → form → dashboard. No uncaught errors.

- [ ] **Step 3: Final push**

```bash
git push origin master
```

---

## Appendix: Frappe asset reload

```bash
# For development (assets served live):
bench serve

# For production (rebuild minified bundle):
bench build --app vernon_desk

# After DocType JSON changes:
bench --site [your-site] migrate
```

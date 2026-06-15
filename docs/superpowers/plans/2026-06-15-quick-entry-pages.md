# Vernon Quick Entry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four simplified Desk Pages (Sales Invoice, Purchase Invoice, Stock Entry, Payment Entry) that create the real ERPNext document from a minimal field set.

**Architecture:** Config-driven client engine mirroring the existing `vernon_desk` guides feature — a DATA layer (`window.VernonDeskQuickEntryData`, frozen config) loaded before a VIEW layer (`window.VernonDeskQuickEntry.render(body, key)`, pure DOM builders + one isolated `frappe.client.insert` call). Each Page is a thin bootstrap shell. All taxes/GL/stock stay in ERPNext server controllers.

**Tech Stack:** Vanilla JS (no bundler), Frappe `frappe.ui.form.make_control`, `frappe.client.insert`/`submit`, Frappe `Page` doctype, Workspace fixture, Python `unittest` (bench-free static tests).

**Spec:** `docs/superpowers/specs/2026-06-15-quick-entry-pages-design.md`

**Path note:** the app package root is `vernon_desk/` (one level under the git repo `vernon_desk/`). The module folder is `vernon_desk/vernon_desk/`. All paths below are relative to the git repo root `/Users/erickmo/Desktop/Project/frappe/apps/vernon_desk`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `vernon_desk/public/js/vernon_desk_quickentry_data.js` | DATA layer — frozen `FIELDTYPES` + `FORMS` config, no DOM/logic |
| `vernon_desk/public/js/vernon_desk_quickentry.js` | VIEW/engine — build form from config, validate, insert/submit |
| `vernon_desk/public/css/vernon_desk_quickentry.css` | Styling via existing `--vd-*` tokens |
| `vernon_desk/vernon_desk/page/sales_quick_invoice/{.json,.js}` | Page shell → `render(main, "sales")` |
| `vernon_desk/vernon_desk/page/purchase_quick_invoice/{.json,.js}` | Page shell → `render(main, "purchase")` |
| `vernon_desk/vernon_desk/page/stock_quick_entry/{.json,.js}` | Page shell → `render(main, "stock")` |
| `vernon_desk/vernon_desk/page/payment_quick_entry/{.json,.js}` | Page shell → `render(main, "payment")` |
| `vernon_desk/fixtures/workspace.json` | "Input Cepat" shortcuts on Vernon Desk workspace |
| `vernon_desk/hooks.py` | Wire the 2 JS + 1 CSS assets; Workspace fixture filter already present |
| `vernon_desk/tests/test_quickentry.py` | Bench-free static integrity tests |

**Testing note:** existing tests (`test_guides.py`) run as plain `unittest` with **no frappe import / no bench** — they validate the static surface (Page JSON, slug registration, hook wiring + ordering, config consistency via regex). This plan follows the same approach. Live document-insertion is covered by the **manual acceptance checklist** in Task 7, not automated CI, because it needs master data (Customer/Item/Account) on a real site.

---

### Task 1: DATA layer (config) + data-model test

**Files:**
- Create: `vernon_desk/tests/test_quickentry.py`
- Create: `vernon_desk/public/js/vernon_desk_quickentry_data.js`

- [ ] **Step 1: Write the failing test** — create `vernon_desk/tests/test_quickentry.py`:

```python
"""Integrity tests for the Vernon quick-entry desk Pages.

Bench-free (plain unittest, no frappe import): verifies the static surface —
each quick-entry Page has a valid standard Page record, its page JS registers
the matching slug, the shared assets exist and are wired into hooks.py in the
right order, and the FORMS config is internally consistent.

Covers: docs/superpowers/specs/2026-06-15-quick-entry-pages-design.md
"""

import json
import os
import re
import unittest

# tests/ lives at <app_package>/tests, so the package root is one level up.
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PAGE_DIR = os.path.join(APP_DIR, "vernon_desk", "page")
ENGINE_JS = os.path.join(APP_DIR, "public", "js", "vernon_desk_quickentry.js")
DATA_JS = os.path.join(APP_DIR, "public", "js", "vernon_desk_quickentry_data.js")
QE_CSS = os.path.join(APP_DIR, "public", "css", "vernon_desk_quickentry.css")

# dir_name -> (page slug, page title, render key)
PAGES = {
    "sales_quick_invoice": ("sales-quick-invoice", "Faktur Penjualan Cepat", "sales"),
    "purchase_quick_invoice": ("purchase-quick-invoice", "Faktur Pembelian Cepat", "purchase"),
    "stock_quick_entry": ("stock-quick-entry", "Input Stok Cepat", "stock"),
    "payment_quick_entry": ("payment-quick-entry", "Pembayaran Cepat", "payment"),
}

# Field types the engine knows how to render (mirror FIELDTYPES in the data JS).
FIELDTYPES = {"Link", "Date", "Float", "Currency", "Select", "Data"}


def _read(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


class TestQuickEntryDataModel(unittest.TestCase):
    """Parse the FORMS config out of the data JS and check consistency."""

    @classmethod
    def setUpClass(cls):
        cls.js = _read(DATA_JS)

    def test_four_forms_declared(self):
        for key in ("sales", "purchase", "stock", "payment"):
            self.assertRegex(self.js, r"\b" + key + r"\s*:\s*\{")

    def test_every_form_has_a_doctype(self):
        doctypes = re.findall(r'doctype:\s*"([^"]*)"', self.js)
        self.assertGreaterEqual(len(doctypes), 4, "expected >= 4 form doctypes")
        self.assertTrue(all(d.strip() for d in doctypes), "empty doctype found")

    def test_every_fieldtype_is_known(self):
        types = set(re.findall(r"fieldtype:\s*T\.([A-Z]+)", self.js))
        self.assertTrue(types, "no fieldtypes parsed")
        # T.<NAME> aliases resolve to FIELDTYPES values; assert each alias name
        # maps to a known label by checking the FIELDTYPES freeze block.
        freeze = re.search(r"FIELDTYPES\s*=\s*Object\.freeze\(\{([^}]*)\}\)", self.js)
        self.assertIsNotNone(freeze, "FIELDTYPES freeze block not found")
        labels = set(re.findall(r'"([A-Za-z]+)"', freeze.group(1)))
        self.assertTrue(labels.issubset(FIELDTYPES), "unknown fieldtype label(s): " + str(labels - FIELDTYPES))

    def test_data_exposes_window_global(self):
        self.assertIn("window.VernonDeskQuickEntryData", self.js)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest vernon_desk.tests.test_quickentry.TestQuickEntryDataModel -v`
(run from the app package parent, or `cd vernon_desk && python -m unittest tests.test_quickentry...`)
Expected: FAIL — `FileNotFoundError` for `vernon_desk_quickentry_data.js`.

- [ ] **Step 3: Write the data layer** — create `vernon_desk/public/js/vernon_desk_quickentry_data.js`:

```js
/* ── Vernon Desk · Quick Entry — DATA layer ────────────────────
 * Pure config consumed by vernon_desk_quickentry.js (the view). No logic,
 * no DOM, no server calls. Loaded BEFORE the view via app_include_js so
 * window.VernonDeskQuickEntryData is ready when the engine runs.
 *
 * Each form: { key, title, doctype, needs_company, submittable,
 *   fields: [parent field df...],
 *   child?: { table_field, label, min_rows, fields: [row field df...] } }.
 * A field df mirrors a Frappe DocField: { fieldname, label, fieldtype,
 *   options?, reqd?, default?, options_from? }. options_from names another
 *   field whose value supplies a dynamic Link target (Payment Entry party).
 * ───────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    /* Field types the engine can render — referenced as T.* (no magic strings). */
    var FIELDTYPES = Object.freeze({
        LINK: "Link", DATE: "Date", FLOAT: "Float",
        CURRENCY: "Currency", SELECT: "Select", DATA: "Data",
    });
    var T = FIELDTYPES;

    var FORMS = {
        sales: {
            key: "sales", title: "Faktur Penjualan Cepat",
            doctype: "Sales Invoice", needs_company: true, submittable: true,
            fields: [
                { fieldname: "customer", label: "Pelanggan", fieldtype: T.LINK, options: "Customer", reqd: 1 },
                { fieldname: "posting_date", label: "Tanggal", fieldtype: T.DATE, default: "Today" },
            ],
            child: {
                table_field: "items", label: "Barang", min_rows: 1,
                fields: [
                    { fieldname: "item_code", label: "Barang", fieldtype: T.LINK, options: "Item", reqd: 1 },
                    { fieldname: "qty", label: "Jumlah", fieldtype: T.FLOAT, reqd: 1, default: 1 },
                    { fieldname: "rate", label: "Harga", fieldtype: T.CURRENCY },
                ],
            },
        },
        purchase: {
            key: "purchase", title: "Faktur Pembelian Cepat",
            doctype: "Purchase Invoice", needs_company: true, submittable: true,
            fields: [
                { fieldname: "supplier", label: "Pemasok", fieldtype: T.LINK, options: "Supplier", reqd: 1 },
                { fieldname: "posting_date", label: "Tanggal", fieldtype: T.DATE, default: "Today" },
                { fieldname: "bill_no", label: "No. Tagihan Pemasok", fieldtype: T.DATA },
            ],
            child: {
                table_field: "items", label: "Barang", min_rows: 1,
                fields: [
                    { fieldname: "item_code", label: "Barang", fieldtype: T.LINK, options: "Item", reqd: 1 },
                    { fieldname: "qty", label: "Jumlah", fieldtype: T.FLOAT, reqd: 1, default: 1 },
                    { fieldname: "rate", label: "Harga", fieldtype: T.CURRENCY },
                ],
            },
        },
        stock: {
            key: "stock", title: "Input Stok Cepat",
            doctype: "Stock Entry", needs_company: true, submittable: true,
            fields: [
                { fieldname: "stock_entry_type", label: "Jenis", fieldtype: T.SELECT,
                  options: "Material Issue\nMaterial Receipt\nMaterial Transfer", reqd: 1, default: "Material Receipt" },
                { fieldname: "posting_date", label: "Tanggal", fieldtype: T.DATE, default: "Today" },
            ],
            child: {
                table_field: "items", label: "Barang", min_rows: 1,
                fields: [
                    { fieldname: "item_code", label: "Barang", fieldtype: T.LINK, options: "Item", reqd: 1 },
                    { fieldname: "qty", label: "Jumlah", fieldtype: T.FLOAT, reqd: 1, default: 1 },
                    { fieldname: "s_warehouse", label: "Gudang Asal", fieldtype: T.LINK, options: "Warehouse" },
                    { fieldname: "t_warehouse", label: "Gudang Tujuan", fieldtype: T.LINK, options: "Warehouse" },
                ],
            },
        },
        payment: {
            key: "payment", title: "Pembayaran Cepat",
            doctype: "Payment Entry", needs_company: true, submittable: false,
            /* submittable:false — Payment Entry needs paid_from/paid_to GL
               accounts that ERPNext fetches via get_party_details. We save a
               DRAFT only (server set_missing_values fills accounts where it
               can); the toast links to the real form to finish + submit.
               Enabling submit later requires a party-account fetch step. */
            fields: [
                { fieldname: "payment_type", label: "Jenis", fieldtype: T.SELECT,
                  options: "Receive\nPay", reqd: 1, default: "Receive" },
                { fieldname: "party_type", label: "Jenis Pihak", fieldtype: T.SELECT,
                  options: "Customer\nSupplier", reqd: 1, default: "Customer" },
                { fieldname: "party", label: "Pihak", fieldtype: T.LINK, options_from: "party_type", reqd: 1 },
                { fieldname: "paid_amount", label: "Jumlah", fieldtype: T.CURRENCY, reqd: 1 },
                { fieldname: "mode_of_payment", label: "Metode", fieldtype: T.LINK, options: "Mode of Payment" },
                { fieldname: "posting_date", label: "Tanggal", fieldtype: T.DATE, default: "Today" },
            ],
        },
    };

    window.VernonDeskQuickEntryData = { FIELDTYPES: FIELDTYPES, FORMS: FORMS };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest vernon_desk.tests.test_quickentry.TestQuickEntryDataModel -v`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add vernon_desk/tests/test_quickentry.py vernon_desk/public/js/vernon_desk_quickentry_data.js
git commit -m "feat(quick-entry): konfigurasi DATA layer + uji integritas FORMS"
```

---

### Task 2: VIEW engine

**Files:**
- Create: `vernon_desk/public/js/vernon_desk_quickentry.js`
- Modify: `vernon_desk/tests/test_quickentry.py` (add `TestEngineSurface`)

- [ ] **Step 1: Write the failing test** — append this class to `test_quickentry.py` (before the `if __name__` block):

```python
class TestEngineSurface(unittest.TestCase):
    """The engine file exists and exposes the public API with no server logic."""

    @classmethod
    def setUpClass(cls):
        cls.js = _read(ENGINE_JS)

    def test_engine_exposes_window_global(self):
        self.assertIn("window.VernonDeskQuickEntry", self.js)
        self.assertRegex(self.js, r"render\s*:")

    def test_engine_inserts_via_client_api(self):
        # Business logic stays server-side: the engine only calls the generic
        # client insert/submit endpoints, never bespoke server methods.
        self.assertIn("frappe.client.insert", self.js)

    def test_engine_reads_data_layer(self):
        self.assertIn("window.VernonDeskQuickEntryData", self.js)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest vernon_desk.tests.test_quickentry.TestEngineSurface -v`
Expected: FAIL — `FileNotFoundError` for `vernon_desk_quickentry.js`.

- [ ] **Step 3: Write the engine** — create `vernon_desk/public/js/vernon_desk_quickentry.js`:

```js
/* ── Vernon Desk · Quick Entry — VIEW layer ────────────────────
 * Simplified single-doctype entry forms for Sales Invoice / Purchase
 * Invoice / Stock Entry / Payment Entry. Builds a minimal form from the
 * config in vernon_desk_quickentry_data.js using NATIVE Frappe controls,
 * then creates the real document via frappe.client.insert — so all taxes,
 * GL and stock logic stays in the ERPNext server controllers.
 *
 * Layer: VIEW only. Builders are pure (config -> DOM). The ONLY behavior
 * is the save handler (insert/submit), kept isolated in save_doc().
 * Theming uses the existing --vd-* CSS vars (vernon_desk_quickentry.css).
 *
 * Public API: window.VernonDeskQuickEntry
 *   .render(body, key)  → quick-entry form for FORMS[key]
 * ───────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    var DATA = window.VernonDeskQuickEntryData || { FIELDTYPES: {}, FORMS: {} };
    var FORMS = DATA.FORMS;

    /* ── Helpers ─────────────────────────────────────────────────── */

    function qe_el(tag, cls, text) {
        var el = document.createElement(tag);
        if (cls) el.className = cls;
        if (text != null) el.textContent = text;
        return el;
    }

    /* Accept a jQuery wrapper (Frappe page.main) or a raw DOM node. */
    function normalize(body) {
        if (!body) return null;
        return body.jquery ? body.get(0) : body;
    }

    /* Resolve a field's default into a concrete value ("Today" -> date). */
    function default_value(df) {
        if (df.default === "Today") return frappe.datetime.get_today();
        return df.default != null ? df.default : "";
    }

    /* The Link target for a field: static options, or a dynamic doctype
       pulled from a sibling field's current value (options_from). */
    function link_target(df, get_sibling) {
        if (df.options) return df.options;
        if (df.options_from && get_sibling) return get_sibling(df.options_from);
        return "";
    }

    /* ── Control building (native Frappe controls) ───────────────── */

    /* Build one Frappe control into `parent`. Returns the control object;
       callers read/write via control.get_value()/set_value(). get_sibling
       lets a dynamic Link (options_from) resolve its target at build time. */
    function make_field(parent, df, get_sibling) {
        var resolved = Object.assign({}, df);
        if (df.fieldtype === "Link") resolved.options = link_target(df, get_sibling);
        var control = frappe.ui.form.make_control({
            parent: parent, df: resolved, render_input: true,
        });
        control.set_value(default_value(df));
        control.refresh();
        control.df._qe = df;                       // keep original df for validation
        return control;
    }

    /* ── Builders (pure: config -> Element, controls captured by ref) ── */

    function build_header(cfg) {
        var head = qe_el("div", "vd-qe__head");
        head.appendChild(qe_el("h1", "vd-qe__title", cfg.title));
        head.appendChild(qe_el("p", "vd-qe__subtitle", cfg.doctype));
        return head;
    }

    /* Parent field grid. Pushes each control into `controls` keyed by
       fieldname, and wires options_from fields to refresh dependents. */
    function build_fields(cfg, controls) {
        var grid = qe_el("div", "vd-qe__grid");
        function get_sibling(fieldname) {
            return controls[fieldname] ? controls[fieldname].get_value() : "";
        }
        cfg.fields.forEach(function (df) {
            var cell = qe_el("div", "vd-qe__field");
            controls[df.fieldname] = make_field(cell, df, get_sibling);
            grid.appendChild(cell);
        });
        /* Dynamic-Link refresh: when a source field (named by another field's
           options_from) changes, repoint + clear the dependent Link. */
        cfg.fields.forEach(function (df) {
            if (!df.options_from) return;
            var src = controls[df.options_from];
            var dep = controls[df.fieldname];
            if (!src || !dep) return;
            src.$input && src.$input.on("change", function () {
                dep.df.options = src.get_value();
                dep.set_value("");
                dep.refresh();
            });
        });
        return grid;
    }

    /* ── Child table (dynamic rows) ──────────────────────────────── */

    /* Returns { el, rows }, where rows is a live array of { controls }.
       add_row()/remove_row() mutate it; min_rows blocks over-removal. */
    function build_child(child) {
        var rows = [];
        var section = qe_el("div", "vd-qe__child");
        section.appendChild(qe_el("h2", "vd-qe__child-title", child.label));
        var list = qe_el("div", "vd-qe__rows");
        section.appendChild(list);

        function add_row() {
            var row = qe_el("div", "vd-qe__row");
            var entry = { controls: {} };
            child.fields.forEach(function (df) {
                var cell = qe_el("div", "vd-qe__cell");
                entry.controls[df.fieldname] = make_field(cell, df, null);
                row.appendChild(cell);
            });
            var del = qe_el("button", "vd-qe__row-del", "✕");
            del.type = "button";
            del.addEventListener("click", function () { remove_row(entry, row); });
            row.appendChild(del);
            list.appendChild(row);
            rows.push(entry);
        }

        function remove_row(entry, row) {
            if (rows.length <= child.min_rows) {
                frappe.show_alert({ message: __("Minimal {0} baris", [child.min_rows]), indicator: "orange" });
                return;
            }
            rows.splice(rows.indexOf(entry), 1);
            row.remove();
        }

        var add = qe_el("button", "vd-qe__add", "+ Tambah baris");
        add.type = "button";
        add.addEventListener("click", add_row);
        section.appendChild(add);

        for (var i = 0; i < child.min_rows; i++) add_row();
        return { el: section, rows: rows };
    }

    /* ── Validation + collection ─────────────────────────────────── */

    /* Return a list of missing required-field labels; mark empty controls. */
    function validate(cfg, controls, child_rows) {
        var missing = [];
        cfg.fields.forEach(function (df) {
            if (df.reqd && !controls[df.fieldname].get_value()) {
                missing.push(df.label);
                controls[df.fieldname].$wrapper && controls[df.fieldname].$wrapper.addClass("has-error");
            }
        });
        if (cfg.child) {
            child_rows.forEach(function (entry, idx) {
                cfg.child.fields.forEach(function (df) {
                    if (df.reqd && !entry.controls[df.fieldname].get_value()) {
                        missing.push(cfg.child.label + " #" + (idx + 1) + ": " + df.label);
                    }
                });
            });
        }
        return missing;
    }

    /* Assemble the document payload from parent controls + child rows. */
    function collect(cfg, controls, child_rows) {
        var doc = { doctype: cfg.doctype };
        cfg.fields.forEach(function (df) {
            var v = controls[df.fieldname].get_value();
            if (v !== "" && v != null) doc[df.fieldname] = v;
        });
        if (cfg.child) {
            doc[cfg.child.table_field] = child_rows.map(function (entry) {
                var row = {};
                cfg.child.fields.forEach(function (df) {
                    var v = entry.controls[df.fieldname].get_value();
                    if (v !== "" && v != null) row[df.fieldname] = v;
                });
                return row;
            });
        }
        if (cfg.needs_company) {
            var company = frappe.defaults.get_user_default("Company");
            if (company) doc.company = company;
        }
        return doc;
    }

    /* ── Behavior: the ONE async action ──────────────────────────── */

    function save_doc(cfg, controls, child_rows, do_submit, on_done) {
        var missing = validate(cfg, controls, child_rows);
        if (missing.length) {
            frappe.show_alert({ message: __("Lengkapi: ") + missing.join(", "), indicator: "red" });
            return;
        }
        var doc = collect(cfg, controls, child_rows);
        frappe.dom.freeze(__("Menyimpan…"));
        frappe.call({ method: "frappe.client.insert", args: { doc: doc } })
            .then(function (r) {
                var created = r && r.message;
                if (!created) return;
                if (do_submit && cfg.submittable) {
                    return frappe.call({ method: "frappe.client.submit", args: { doc: created } })
                        .then(function () { announce(cfg, created); on_done(); });
                }
                announce(cfg, created);
                on_done();
            })
            .always(function () { frappe.dom.unfreeze(); });
    }

    /* Success toast with a link to the created document (reset handled by caller). */
    function announce(cfg, created) {
        var href = "/app/" + frappe.router.slug(cfg.doctype) + "/" + encodeURIComponent(created.name);
        frappe.show_alert({
            message: __("Dibuat: ") + '<a href="' + href + '">' + frappe.utils.escape_html(created.name) + "</a>",
            indicator: "green",
        }, 7);
    }

    /* ── Footer ──────────────────────────────────────────────────── */

    function build_footer(cfg, on_save, on_submit) {
        var footer = qe_el("div", "vd-qe__footer");
        var save = qe_el("button", "btn btn-default vd-qe__btn", "Simpan");
        save.type = "button";
        save.addEventListener("click", on_save);
        footer.appendChild(save);
        if (cfg.submittable) {
            var submit = qe_el("button", "btn btn-primary vd-qe__btn", "Simpan & Ajukan");
            submit.type = "button";
            submit.addEventListener("click", on_submit);
            footer.appendChild(submit);
        }
        return footer;
    }

    /* ── Public renderer ─────────────────────────────────────────── */

    function render(body, key) {
        var root = normalize(body);
        if (!root) return;
        root.innerHTML = "";
        var wrap = qe_el("div", "vd-qe");
        var cfg = FORMS[key];
        if (!cfg) {
            wrap.appendChild(qe_el("div", "vd-qe__error", '⚠️ Form "' + key + '" tidak ditemukan.'));
            root.appendChild(wrap);
            return;
        }
        var controls = {};
        var child_built = cfg.child ? build_child(cfg.child) : null;
        var child_rows = child_built ? child_built.rows : [];

        wrap.appendChild(build_header(cfg));
        wrap.appendChild(build_fields(cfg, controls));
        if (child_built) wrap.appendChild(child_built.el);

        function reset() { render(root, key); }                 // idempotent rebuild
        wrap.appendChild(build_footer(
            cfg,
            function () { save_doc(cfg, controls, child_rows, false, reset); },
            function () { save_doc(cfg, controls, child_rows, true, reset); }
        ));
        root.appendChild(wrap);
    }

    window.VernonDeskQuickEntry = { render: render, FORMS: FORMS };
})();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest vernon_desk.tests.test_quickentry.TestEngineSurface -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add vernon_desk/public/js/vernon_desk_quickentry.js vernon_desk/tests/test_quickentry.py
git commit -m "feat(quick-entry): mesin VIEW form input cepat + uji surface"
```

---

### Task 3: CSS + Page shells + hooks wiring

**Files:**
- Create: `vernon_desk/public/css/vernon_desk_quickentry.css`
- Create: `vernon_desk/vernon_desk/page/{sales_quick_invoice,purchase_quick_invoice,stock_quick_entry,payment_quick_entry}/{<dir>.json,<dir>.js,__init__.py}`
- Modify: `vernon_desk/hooks.py`
- Modify: `vernon_desk/tests/test_quickentry.py` (add `TestPageRecords`, `TestSharedAssets`)

- [ ] **Step 1: Write the failing tests** — append to `test_quickentry.py`:

```python
class TestPageRecords(unittest.TestCase):
    """Every quick-entry dir ships a valid standard Page + matching JS."""

    def test_page_json_is_valid(self):
        for dir_name, (slug, title, _key) in PAGES.items():
            path = os.path.join(PAGE_DIR, dir_name, dir_name + ".json")
            self.assertTrue(os.path.exists(path), "missing " + path)
            record = json.loads(_read(path))
            self.assertEqual(record["doctype"], "Page")
            self.assertEqual(record["name"], slug)
            self.assertEqual(record["page_name"], slug)
            self.assertEqual(record["title"], title)
            self.assertEqual(record["module"], "Vernon Desk")
            self.assertEqual(record["standard"], "Yes")

    def test_page_js_registers_slug_and_key(self):
        for dir_name, (slug, _title, key) in PAGES.items():
            path = os.path.join(PAGE_DIR, dir_name, dir_name + ".js")
            self.assertTrue(os.path.exists(path), "missing " + path)
            js = _read(path)
            self.assertIn('frappe.pages["' + slug + '"]', js)
            self.assertIn('"' + key + '"', js)


class TestSharedAssets(unittest.TestCase):
    """Engine/data/css exist and are wired into hooks.py in the right order."""

    def test_assets_present(self):
        for path in (ENGINE_JS, DATA_JS, QE_CSS):
            self.assertTrue(os.path.exists(path), path)

    def test_hooks_include_quickentry_assets(self):
        hooks = _read(os.path.join(APP_DIR, "hooks.py"))
        self.assertIn("css/vernon_desk_quickentry.css", hooks)
        self.assertIn("js/vernon_desk_quickentry_data.js", hooks)
        self.assertIn("js/vernon_desk_quickentry.js", hooks)

    def test_data_loads_before_engine(self):
        hooks = _read(os.path.join(APP_DIR, "hooks.py"))
        self.assertLess(
            hooks.index("vernon_desk_quickentry_data.js"),
            hooks.index('vernon_desk_quickentry.js"'),
            "data bundle must be listed before the engine bundle",
        )
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m unittest vernon_desk.tests.test_quickentry -v`
Expected: FAIL — missing page JSONs / assets / hook entries.

- [ ] **Step 3a: Create the CSS** — `vernon_desk/public/css/vernon_desk_quickentry.css`:

```css
/* Vernon Desk · Quick Entry — themed via existing --vd-* tokens so all
   Vernon Desk themes work with no extra CSS. */
.vd-qe { max-width: 760px; margin: 0 auto; padding: 24px; font-family: var(--vd-font); color: var(--vd-text); }
.vd-qe__head { margin-bottom: 20px; }
.vd-qe__title { font-size: 1.6rem; margin: 0; }
.vd-qe__subtitle { color: var(--vd-text-muted); margin: 4px 0 0; }
.vd-qe__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.vd-qe__field { min-width: 0; }
.vd-qe__child { margin-top: 24px; border-top: 1px solid var(--vd-border); padding-top: 16px; }
.vd-qe__child-title { font-size: 1.05rem; margin: 0 0 12px; }
.vd-qe__rows { display: flex; flex-direction: column; gap: 10px; }
.vd-qe__row { display: grid; grid-template-columns: repeat(4, 1fr) 32px; gap: 10px; align-items: end;
  background: var(--vd-card-bg); border: 1px solid var(--vd-border); border-radius: var(--vd-radius); padding: 10px; }
.vd-qe__row-del { border: none; background: transparent; color: var(--vd-text-muted); cursor: pointer; font-size: 1rem; }
.vd-qe__add { margin-top: 12px; border: 1px dashed var(--vd-border); background: transparent; color: var(--vd-accent);
  border-radius: var(--vd-radius); padding: 8px 14px; cursor: pointer; }
.vd-qe__footer { margin-top: 24px; display: flex; gap: 12px; }
.vd-qe__btn { min-width: 140px; }
.vd-qe__field .has-error input, .vd-qe__field.has-error input { border-color: #e24c4b; }
.vd-qe__error { background: var(--vd-card-bg); border: 1px solid var(--vd-border); border-radius: var(--vd-radius);
  padding: 16px; color: var(--vd-text); }
@media (max-width: 640px) {
  .vd-qe__grid { grid-template-columns: 1fr; }
  .vd-qe__row { grid-template-columns: 1fr 1fr 28px; }
}
```

- [ ] **Step 3b: Create the four Page shells.** For each, create `__init__.py` (empty), `<dir>.json`, and `<dir>.js`.

`vernon_desk/vernon_desk/page/sales_quick_invoice/sales_quick_invoice.json`:
```json
{
 "doctype": "Page",
 "name": "sales-quick-invoice",
 "page_name": "sales-quick-invoice",
 "title": "Faktur Penjualan Cepat",
 "module": "Vernon Desk",
 "standard": "Yes",
 "system_page": 0,
 "modified": "2026-06-15 00:00:00",
 "roles": []
}
```

`vernon_desk/vernon_desk/page/sales_quick_invoice/sales_quick_invoice.js`:
```js
/* Desk Page: Faktur Penjualan Cepat. Thin shell over the shared
   VernonDeskQuickEntry bundle (app_include_js). Bounded retry mount with a
   visible fallback if the bundle never loads (same pattern as the guides). */
frappe.pages["sales-quick-invoice"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper, title: __("Faktur Penjualan Cepat"), single_column: true,
    });
    var tries = 0;
    (function mount() {
        if (window.VernonDeskQuickEntry) return window.VernonDeskQuickEntry.render(page.main, "sales");
        if (++tries > 50) {
            return page.main.html(
                '<div class="vd-qe"><div class="vd-qe__error">' +
                "⚠️ Gagal memuat form. Jalankan bench build lalu refresh." +
                "</div></div>"
            );
        }
        setTimeout(mount, 60);
    })();
};
```

`vernon_desk/vernon_desk/page/purchase_quick_invoice/purchase_quick_invoice.json`:
```json
{
 "doctype": "Page",
 "name": "purchase-quick-invoice",
 "page_name": "purchase-quick-invoice",
 "title": "Faktur Pembelian Cepat",
 "module": "Vernon Desk",
 "standard": "Yes",
 "system_page": 0,
 "modified": "2026-06-15 00:00:00",
 "roles": []
}
```

`vernon_desk/vernon_desk/page/purchase_quick_invoice/purchase_quick_invoice.js`:
```js
/* Desk Page: Faktur Pembelian Cepat. Thin shell over VernonDeskQuickEntry. */
frappe.pages["purchase-quick-invoice"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper, title: __("Faktur Pembelian Cepat"), single_column: true,
    });
    var tries = 0;
    (function mount() {
        if (window.VernonDeskQuickEntry) return window.VernonDeskQuickEntry.render(page.main, "purchase");
        if (++tries > 50) {
            return page.main.html(
                '<div class="vd-qe"><div class="vd-qe__error">' +
                "⚠️ Gagal memuat form. Jalankan bench build lalu refresh." +
                "</div></div>"
            );
        }
        setTimeout(mount, 60);
    })();
};
```

`vernon_desk/vernon_desk/page/stock_quick_entry/stock_quick_entry.json`:
```json
{
 "doctype": "Page",
 "name": "stock-quick-entry",
 "page_name": "stock-quick-entry",
 "title": "Input Stok Cepat",
 "module": "Vernon Desk",
 "standard": "Yes",
 "system_page": 0,
 "modified": "2026-06-15 00:00:00",
 "roles": []
}
```

`vernon_desk/vernon_desk/page/stock_quick_entry/stock_quick_entry.js`:
```js
/* Desk Page: Input Stok Cepat. Thin shell over VernonDeskQuickEntry. */
frappe.pages["stock-quick-entry"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper, title: __("Input Stok Cepat"), single_column: true,
    });
    var tries = 0;
    (function mount() {
        if (window.VernonDeskQuickEntry) return window.VernonDeskQuickEntry.render(page.main, "stock");
        if (++tries > 50) {
            return page.main.html(
                '<div class="vd-qe"><div class="vd-qe__error">' +
                "⚠️ Gagal memuat form. Jalankan bench build lalu refresh." +
                "</div></div>"
            );
        }
        setTimeout(mount, 60);
    })();
};
```

`vernon_desk/vernon_desk/page/payment_quick_entry/payment_quick_entry.json`:
```json
{
 "doctype": "Page",
 "name": "payment-quick-entry",
 "page_name": "payment-quick-entry",
 "title": "Pembayaran Cepat",
 "module": "Vernon Desk",
 "standard": "Yes",
 "system_page": 0,
 "modified": "2026-06-15 00:00:00",
 "roles": []
}
```

`vernon_desk/vernon_desk/page/payment_quick_entry/payment_quick_entry.js`:
```js
/* Desk Page: Pembayaran Cepat. Thin shell over VernonDeskQuickEntry. */
frappe.pages["payment-quick-entry"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper, title: __("Pembayaran Cepat"), single_column: true,
    });
    var tries = 0;
    (function mount() {
        if (window.VernonDeskQuickEntry) return window.VernonDeskQuickEntry.render(page.main, "payment");
        if (++tries > 50) {
            return page.main.html(
                '<div class="vd-qe"><div class="vd-qe__error">' +
                "⚠️ Gagal memuat form. Jalankan bench build lalu refresh." +
                "</div></div>"
            );
        }
        setTimeout(mount, 60);
    })();
};
```

Create the four empty `__init__.py` files:
```bash
touch vernon_desk/vernon_desk/page/sales_quick_invoice/__init__.py \
      vernon_desk/vernon_desk/page/purchase_quick_invoice/__init__.py \
      vernon_desk/vernon_desk/page/stock_quick_entry/__init__.py \
      vernon_desk/vernon_desk/page/payment_quick_entry/__init__.py
```

- [ ] **Step 3c: Wire hooks.py.** Replace the `app_include_css` and `app_include_js` blocks in `vernon_desk/hooks.py` with:

```python
app_include_css = [
    "/assets/vernon_desk/css/vernon_desk.css",
    "/assets/vernon_desk/css/vernon_desk_guides.css",
    "/assets/vernon_desk/css/vernon_desk_quickentry.css",
]
app_include_js = [
    "/assets/vernon_desk/js/vernon_desk.js",
    "/assets/vernon_desk/js/vernon_desk_guides_data.js",
    "/assets/vernon_desk/js/vernon_desk_guides.js",
    "/assets/vernon_desk/js/vernon_desk_quickentry_data.js",
    "/assets/vernon_desk/js/vernon_desk_quickentry.js",
]
```

- [ ] **Step 4: Run tests to verify pass**

Run: `python -m unittest vernon_desk.tests.test_quickentry -v`
Expected: PASS (all classes).

- [ ] **Step 5: Commit**

```bash
git add vernon_desk/public/css/vernon_desk_quickentry.css \
        vernon_desk/vernon_desk/page/sales_quick_invoice \
        vernon_desk/vernon_desk/page/purchase_quick_invoice \
        vernon_desk/vernon_desk/page/stock_quick_entry \
        vernon_desk/vernon_desk/page/payment_quick_entry \
        vernon_desk/hooks.py vernon_desk/tests/test_quickentry.py
git commit -m "feat(quick-entry): CSS, 4 halaman Page, wiring hooks.py"
```

---

### Task 4: Navigation — "Input Cepat" workspace shortcuts

**Files:**
- Create: `vernon_desk/fixtures/workspace.json`
- Modify: `vernon_desk/tests/test_quickentry.py` (add `TestWorkspaceFixture`)

`hooks.py` already exports `Workspace` filtered to module "Vernon Desk", so committing a fixture file is enough; `bench migrate` imports it.

- [ ] **Step 1: Write the failing test** — append to `test_quickentry.py`:

```python
class TestWorkspaceFixture(unittest.TestCase):
    """The workspace fixture exposes a shortcut to each quick-entry page."""

    def test_fixture_has_four_quickentry_shortcuts(self):
        path = os.path.join(APP_DIR, "fixtures", "workspace.json")
        self.assertTrue(os.path.exists(path), "missing " + path)
        records = json.loads(_read(path))
        shortcuts = []
        for ws in records:
            shortcuts.extend(ws.get("shortcuts", []))
        targets = {s.get("link_to") for s in shortcuts if s.get("type") == "Page"}
        for _dir, (slug, _title, _key) in PAGES.items():
            self.assertIn(slug, targets, "no workspace shortcut for " + slug)
```

- [ ] **Step 2: Run to verify failure**

Run: `python -m unittest vernon_desk.tests.test_quickentry.TestWorkspaceFixture -v`
Expected: FAIL — missing `fixtures/workspace.json`.

- [ ] **Step 3: Create the fixture** — `vernon_desk/fixtures/workspace.json`:

```json
[
 {
  "doctype": "Workspace",
  "name": "Vernon Desk",
  "label": "Vernon Desk",
  "title": "Vernon Desk",
  "module": "Vernon Desk",
  "public": 1,
  "is_hidden": 0,
  "icon": "tool",
  "sequence_id": 100.0,
  "content": "[{\"id\":\"qe_header\",\"type\":\"header\",\"data\":{\"text\":\"<span class=\\\"h4\\\">Input Cepat</span>\",\"col\":12}},{\"id\":\"qe_sales\",\"type\":\"shortcut\",\"data\":{\"shortcut_name\":\"Faktur Penjualan\",\"col\":3}},{\"id\":\"qe_purchase\",\"type\":\"shortcut\",\"data\":{\"shortcut_name\":\"Faktur Pembelian\",\"col\":3}},{\"id\":\"qe_stock\",\"type\":\"shortcut\",\"data\":{\"shortcut_name\":\"Input Stok\",\"col\":3}},{\"id\":\"qe_payment\",\"type\":\"shortcut\",\"data\":{\"shortcut_name\":\"Pembayaran\",\"col\":3}}]",
  "shortcuts": [
   { "type": "Page", "link_to": "sales-quick-invoice", "label": "Faktur Penjualan", "color": "Grey", "doc_view": "" },
   { "type": "Page", "link_to": "purchase-quick-invoice", "label": "Faktur Pembelian", "color": "Grey", "doc_view": "" },
   { "type": "Page", "link_to": "stock-quick-entry", "label": "Input Stok", "color": "Grey", "doc_view": "" },
   { "type": "Page", "link_to": "payment-quick-entry", "label": "Pembayaran", "color": "Grey", "doc_view": "" }
  ],
  "links": [],
  "roles": []
 }
]
```

> **Verify against the live Frappe version after import.** Workspace schema
> varies slightly across versions. Import with `bench --site <site> migrate`
> (or `bench --site <site> reload-doc vernon_desk workspace "Vernon Desk"` if a
> separate doctype path is used). If the hand-authored record is rejected or the
> card renders wrong, regenerate the canonical version: open the Vernon Desk
> workspace in the UI, add the four Page shortcuts under an "Input Cepat" header,
> Save, then `bench --site <site> export-fixtures --app vernon_desk` and commit
> the regenerated `workspace.json`. The test above still passes for the
> regenerated file (it only asserts the four Page shortcuts exist).

- [ ] **Step 4: Run test to verify pass**

Run: `python -m unittest vernon_desk.tests.test_quickentry.TestWorkspaceFixture -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add vernon_desk/fixtures/workspace.json vernon_desk/tests/test_quickentry.py
git commit -m "feat(quick-entry): kartu Input Cepat + shortcut workspace"
```

---

### Task 5: Build, full suite, acceptance, docs

**Files:**
- Modify: (docs) `docs/implementation-tracker.md` if present; otherwise skip with a note.

- [ ] **Step 1: Run the full static suite**

Run: `python -m unittest vernon_desk.tests.test_quickentry -v`
Expected: PASS — all classes (DataModel, EngineSurface, PageRecords, SharedAssets, WorkspaceFixture).

- [ ] **Step 2: Build assets + import on a real site**

```bash
cd /Users/erickmo/Desktop/Project/frappe
bench build --app vernon_desk
bench --site erp.localhost migrate     # imports the workspace fixture
bench --site erp.localhost clear-cache
```
Expected: build succeeds, migrate imports Workspace without error. (Substitute the
actual site that has ERPNext installed if not `erp.localhost`.)

- [ ] **Step 3: Manual acceptance checklist** (real site, ERPNext installed, with at least one Customer/Supplier/Item/Warehouse/Mode of Payment):

For each page below — open it, fill the fields, click the button, confirm result:

| Page (URL) | Steps | Expected |
|------------|-------|----------|
| `/app/sales-quick-invoice` | pick Customer, add 1 item row (item, qty, rate), **Simpan & Ajukan** | green toast linking to a submitted Sales Invoice; form resets |
| `/app/purchase-quick-invoice` | pick Supplier, 1 item row, **Simpan** | toast links to a draft Purchase Invoice; form resets |
| `/app/stock-quick-entry` | type Material Receipt, item + qty + target warehouse, **Simpan & Ajukan** | submitted Stock Entry; form resets |
| `/app/payment-quick-entry` | type Receive, party_type Customer, party, paid_amount, **Simpan** | draft Payment Entry created (no Submit button — by design); toast links to the real form to finish accounts |

Also verify: leaving a required field empty shows a red "Lengkapi: …" toast and blocks save; the "Input Cepat" card with 4 shortcuts appears on the Vernon Desk workspace; switching Vernon Desk themes keeps the form readable.

- [ ] **Step 4: Self-review against Vernon quality rules**
- No function > 40 lines (engine builders are small + single-purpose). ✅ confirm each.
- No magic strings (field types via `FIELDTYPES`/`T.*`; actions via button handlers). ✅
- No business logic in the client (only `frappe.client.insert`/`submit`). ✅
- Every file has a header comment; every function has a doc comment. ✅ confirm.

- [ ] **Step 5: Update docs** — if `docs/implementation-tracker.md` exists, add a row
for this feature (spec id `2026-06-15-quick-entry-pages`, tests = `test_quickentry.py`,
status = Done). If it does not exist, note that in the commit body and skip.

- [ ] **Step 6: Commit any doc updates**

```bash
git add -A docs
git commit -m "docs(quick-entry): catat status di implementation tracker" || echo "no doc changes"
```

---

## Self-Review (plan vs spec)

- **Spec §4 file layout** → Tasks 1–4 create every listed file. ✅
- **Spec §5 config schema** → Task 1 data file matches (FIELDTYPES frozen, FORMS, child, options_from). ✅
- **Spec §6 engine behavior** → Task 2: native controls, required check, assemble, `frappe.client.insert`, success toast w/ link, reset, error via frappe.call default msgprint. ✅
- **Spec §7 field sets** → Task 1 matches the table exactly (customer/supplier/stock_entry_type/payment fields). ✅
- **Spec §8 Payment Entry risk** → Task 1 `submittable:false` (draft-only) + Task 5 acceptance row + toast-to-real-form fallback (mitigation 2). Submit-with-account-fetch (mitigation 1) explicitly deferred. ✅
- **Spec §9 navigation** → Task 4 workspace fixture with 4 shortcuts + bench export fallback. ✅
- **Spec §10 testing** → bench-free static tests across Tasks 1–4; live insertion = manual acceptance (Task 5) because CI has no master data. Deviation from spec's "automated integration" is intentional and matches the existing `test_guides.py` culture. ✅
- **Decisions** → Draft+Submit buttons (Task 2 footer; payment draft-only per §8); reset after save (Task 2 `reset`); workspace shortcuts (Task 4). ✅
- **Placeholder scan** → no TBD/TODO; all code blocks complete. ✅
- **Type consistency** → `render(body,key)`, `make_field(parent,df,get_sibling)`, `build_child` returns `{el,rows}`, `save_doc(cfg,controls,child_rows,do_submit,on_done)` used consistently across tasks. ✅

---

## Hardening applied (post-audit + post-review)

The implemented code diverges slightly from the task code blocks above because two
multi-agent adversarial passes (against this bench's real Frappe usages) hardened it:

**Pre-implementation audit fixes (applied):**
- `make_field`: dropped the eager `control.refresh()` and the `set_value("")` on fresh
  Link controls (left a stale awesomplete); removed dead `control.df._qe`.
- `wire_dynamic_link` (Payment Entry `party`←`party_type`): seeds `dep.df.options` to the
  source default and guards the repoint with a last-value check so programmatic change
  events don't wipe a typed party.
- `validate()` uses an explicit-empty test so a numeric `0` / `paid_amount` is not flagged
  missing; pushes a friendly "atur Default Company" message instead of a raw server error.
- `render()` uses `$(root).empty()` (handler teardown) instead of `innerHTML`.

**Post-implementation review fixes (applied):**
- `save_doc`: added `.fail` + explicit failure toast; the `if(!created)` branch now toasts
  instead of silently returning; submit failure shows "Tersimpan sebagai draf, gagal
  diajukan" (no silent orphaned draft). New helper `submit_created()`.
- `test_reqd_select_defaults_are_valid_options`: binds each Select default to its OWN
  field's options (the global pool false-passed when a Link shared the value).

All 15 static tests pass; engine passes `node --check`. **Still pending (needs a live
ERPNext site):** Task 5 — `bench build`, `bench migrate` (workspace import), and the
manual acceptance checklist.

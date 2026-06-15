# Vernon Quick Entry — Design Spec

- **Date:** 2026-06-15
- **Status:** Approved (design), pending implementation plan
- **App:** `vernon_desk`
- **Task size:** L (new client engine + 4 Frappe Pages + fixtures + tests, ~15 files)

## 1. Problem

ERPNext transaction forms (Sales Invoice, Purchase Invoice, Stock Entry, Payment
Entry) carry dozens of fields. Day-to-day operators only need a handful to record
a transaction. We want fast, low-clutter entry **without** modifying the real
forms and **without** reimplementing any ERPNext business logic.

## 2. Goals / Non-goals

**Goals**
- Four simplified, single-purpose entry **Pages** (one per domain) that create the
  real ERPNext document with only essential fields.
- All taxes / GL / stock computation stays in ERPNext's own server controllers.
- Consistent with the existing `vernon_desk` guides architecture (DATA + VIEW
  layers, `frappe.ui` native controls, `--vd-*` theming).

**Non-goals**
- No edit/list/report views — creation only (the real form handles the rest).
- No new server doctypes or business logic.
- No modification of ERPNext core forms (mechanism B was explicitly rejected).
- No portal/Web Form (rejected — Desk Pages only).

## 3. Chosen approach

**Config-driven engine + 4 thin Pages** (Approach 1, approved). One generic
quick-entry renderer reads a per-domain config and builds the form from native
Frappe controls; each Page is a ~20-line bootstrap shell. Mirrors the guides
feature exactly.

## 4. File layout

```
vernon_desk/public/js/vernon_desk_quickentry_data.js   # DATA: window.VernonDeskQuickEntryData
vernon_desk/public/js/vernon_desk_quickentry.js        # VIEW/engine: window.VernonDeskQuickEntry.render(body, key)
vernon_desk/public/css/vernon_desk_quickentry.css      # styling, themed via existing --vd-* vars
vernon_desk/vernon_desk/page/sales_quick_invoice/      # .json (Page) + .js (thin shell)
vernon_desk/vernon_desk/page/purchase_quick_invoice/
vernon_desk/vernon_desk/page/stock_quick_entry/
vernon_desk/vernon_desk/page/payment_quick_entry/
vernon_desk/vernon_desk/tests/test_quickentry.py       # mirrors test_guides.py
vernon_desk/hooks.py                                    # +2 js, +1 css in app_include_*
fixtures (Workspace)                                    # "Input Cepat" card, 4 shortcuts
```

### Layer responsibility

- **DATA layer** (`*_quickentry_data.js`): pure frozen config, no DOM, no logic,
  no server calls. Loaded first via `app_include_js`. Exposes
  `window.VernonDeskQuickEntryData = { FIELDTYPES, FORMS }`.
- **VIEW layer** (`*_quickentry.js`): pure DOM builders + exactly one isolated
  async behavior (the insert/submit call). No business logic.
- **Page shells** (`page/*/*.js`): bounded-retry mount calling
  `window.VernonDeskQuickEntry.render(page.main, "<key>")`, with a visible
  fallback if the bundle never loads (identical pattern to the guides shells).

## 5. Config schema (DATA layer)

```js
FIELDTYPES = Object.freeze({ LINK:"Link", DATE:"Date", FLOAT:"Float",
  CURRENCY:"Currency", SELECT:"Select", DATA:"Data", CHECK:"Check" });

FORMS = {
  sales: {
    key: "sales",
    title: "Faktur Penjualan Cepat",
    doctype: "Sales Invoice",
    fields: [                                  // parent fields
      { fieldname:"customer",     label:"Pelanggan", fieldtype:"Link", options:"Customer", reqd:1 },
      { fieldname:"posting_date", label:"Tanggal",   fieldtype:"Date", default:"Today" },
    ],
    child: {                                   // optional child table
      table_field:"items", label:"Barang", min_rows:1,
      fields: [
        { fieldname:"item_code", label:"Barang", fieldtype:"Link",  options:"Item", reqd:1 },
        { fieldname:"qty",       label:"Jumlah", fieldtype:"Float",  reqd:1, default:1 },
        { fieldname:"rate",      label:"Harga",  fieldtype:"Currency" },
      ],
    },
  },
  // purchase, stock, payment ...
};
```

Rules:
- All field types reference `FIELDTYPES.*` — no magic strings.
- `company` is auto-filled from `frappe.defaults.get_user_default("Company")`
  when a form declares it needs company; the user never types it.
- A field may declare `depends_on_field` + `get_options(values)` for dynamic
  links (Payment Entry `party` depends on `party_type`).

## 6. Engine behavior (VIEW layer)

`render(body, key)`:
1. Resolve `cfg = FORMS[key]`; if missing → visible error (never throw).
2. Build header (title).
3. Build each parent field with `frappe.ui.form.make_control` so Link fields get
   real autocomplete, Date gets the picker, Currency gets formatting.
4. If `cfg.child`: render a child-table section with add/remove row controls;
   each row builds its own native controls. Enforce `min_rows`.
5. Footer: `[ Simpan ]` and `[ Simpan & Ajukan ]` (decision: Draft + Submit).

Submit handler (the only async behavior, kept isolated from builders):
1. Client-side required check; highlight any empty `reqd` field, abort if gaps.
2. Assemble `doc = { doctype, ...parent_values, [child.table_field]: rows }`.
3. `frappe.client.insert(doc)`.
4. On success: `frappe.show_alert` with a link to the created doc; if the
   "Ajukan" button was used, follow with a submit call; then **reset the form**
   for the next entry (decision: reset).
5. On error: `frappe.msgprint` with the server message (mandatory-field or
   permission errors surface verbatim).

**No business logic** lives here — ERPNext's server controller computes taxes,
GL entries and stock ledger on insert + submit.

## 7. Field sets (initial minimal)

| Page | Doctype | Parent fields | Child rows |
|------|---------|---------------|-----------|
| `sales_quick_invoice` | Sales Invoice | customer*, posting_date | items: item_code*, qty*, rate |
| `purchase_quick_invoice` | Purchase Invoice | supplier*, posting_date, bill_no | items: item_code*, qty*, rate |
| `stock_quick_entry` | Stock Entry | stock_entry_type*, posting_date | items: item_code*, qty*, s_warehouse, t_warehouse |
| `payment_quick_entry` | Payment Entry | payment_type*, party_type*, party*, paid_amount*, mode_of_payment | — |

`*` = required. `company` auto-filled on all four where the doctype requires it.

## 8. Known risk — Payment Entry

Payment Entry needs `paid_from` / `paid_to` GL accounts that ERPNext normally
auto-fetches through `get_party_details`. A bare `frappe.client.insert` may not
populate them → "mandatory" error on insert/submit.

**Mitigation (in priority order):**
1. On `party` select, call ERPNext's party-details helper
   (`erpnext.accounts.party.get_party_details` or the Payment Entry equivalent)
   and pre-fill the account fields into the doc payload.
2. If (1) is unavailable on the target site, fall back to: save as **draft only**
   for Payment Entry and let the operator complete accounts on the real form
   (toast links straight to it).

Decision deferred to the plan: implement (1); keep (2) as the tested fallback.
This page gets the heaviest integration test.

## 9. Navigation

Add an **"Input Cepat"** card with four shortcuts to the Vernon Desk Workspace
(already exported via the `Workspace` fixture in `hooks.py`). Native, no nav
hacking. Re-export the fixture after creation.

## 10. Testing strategy

Mirror `test_quickentry.py` on `test_guides.py`:
- **Unit / registration:** each of the 4 Page docs exists, `standard=Yes`,
  `module="Vernon Desk"`, correct `page_name`.
- **Config integrity:** every `FORMS[key].doctype` resolves to an installed
  doctype; every parent/child `fieldname` exists on that doctype's meta; every
  `options` link target is an installed doctype. (Guards against typos and
  against the doctype-existence risk we found during brainstorming.)
- **Integration:** insert a minimal doc per form via the assembled payload shape
  and assert it saves (Payment Entry: assert draft saves with mitigation (1)).
- Tag each test with the spec id per Vernon test-doc linking.

## 11. Out of scope

Edit flows, list/report views, bulk import, offline, mobile-specific layout,
custom server endpoints. Adding a 5th form later = one `FORMS` entry + one Page
shell (the engine is generic).

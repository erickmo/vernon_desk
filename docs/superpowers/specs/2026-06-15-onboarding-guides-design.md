# Vernon Desk — ERPNext Onboarding Guides (Design Spec)

**Date:** 2026-06-15
**Status:** Approved
**Owner:** Erick Mo
**Task size:** L (new desk Page surface + 2 shared modules, ~16 files)

---

## 1. Goal

Help new ERPNext users understand the system by visualizing the document
workflow for **Sales**, **Purchase**, and **Stock** as role-based swimlane
diagrams inside the Vernon Desk skin. Each stage deep-links to the real
ERPNext DocType (list / new / report) so the guide doubles as an action launcher.

Also: a light, cohesive "modern & elegant" visual pass scoped to these new
pages + shared design tokens — built entirely on existing `--vd-*` CSS
variables so all 5 themes (4 dark + `light_stripe`) work with zero regression.

## 2. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Page type | **Desk Pages** under `/app` (native Frappe Page) |
| 2 | Stage data | **Static + deep-link** (no live ERPNext queries) |
| 3 | Visual style | **Swimlane per role** (rows = role, columns = stage) |
| 4 | Restyle scope | **3 new pages + shared tokens** (no global desk restyle) |

## 3. Architecture

```
vernon_desk/
  public/
    css/vernon_desk_guides.css   # NEW — swimlane/node/hub, themed via --vd-*
    js/vernon_desk_guides.js     # NEW — WORKFLOWS data + window.VernonDeskGuides
  vernon_desk/page/
    vernon_onboarding/  vernon_onboarding.{json,js} + __init__.py   # hub
    sales_guide/        sales_guide.{json,js} + __init__.py
    purchase_guide/     purchase_guide.{json,js} + __init__.py
    stock_guide/        stock_guide.{json,js} + __init__.py
  hooks.py              # + guides css/js in app_include_*
  tests/test_guides.py  # NEW — page JSON + data-model integrity
```

### 3.1 Decoupling (DRY, clean layers)

One renderer, three datasets. `window.VernonDeskGuides`:

- **`WORKFLOWS`** — pure data `{ sales, purchase, stock }`. No logic.
  Each workflow: `{ key, title, subtitle, intro, lanes:[{id,role,icon}],
  stages:[{label, lane, doctype, action, desc, tip, report?}] }`.
- **`render(body, key)`** — build swimlane from data. Decomposed into small
  builders (`buildHeader`, `buildLegend`, `buildLane`, `buildNode`,
  `buildConnector`). Each function ≤ 40 lines. Presentation only.
- **`renderHub(body)`** — 3 cards → each guide page.
- Node click → `frappe.set_route('List', doctype)`, or `frappe.new_doc(doctype)`
  for `action:'new'`, or `frappe.set_route('query-report', doctype)` when `report`.

Each page `.js` is thin (~8 lines): `frappe.ui.make_app_page(...)` →
`VernonDeskGuides.render(page.body, '<key>')`.

### 3.2 Page JSON contract

Standard desk Page record per slug:
```json
{ "doctype": "Page", "name": "sales-guide", "page_name": "sales-guide",
  "title": "Panduan Penjualan", "module": "Vernon Desk",
  "standard": "Yes", "system_page": 0,
  "roles": [] }
```
`standard: "Yes"` + on-disk dir = shippable. Empty `roles` = all desk users.

## 4. Workflow content (the contract for fan-out)

Lane ids: `primary` (owning role), `wh` (Gudang), `fin` (Finance/Accounting).

### 4.1 Sales — `Panduan Penjualan` (key `sales`)
Lanes: Sales 📈 (primary) · Gudang 📦 (wh) · Finance 💰 (fin)

| # | Stage (DocType) | Lane | Action | Desc (ID) |
|---|-----------------|------|--------|-----------|
| 1 | Lead | primary | list | Tangkap calon pelanggan |
| 2 | Opportunity | primary | list | Kualifikasi minat & kebutuhan |
| 3 | Quotation | primary | new | Kirim penawaran harga |
| 4 | Sales Order | primary | list | Konfirmasi pesanan pelanggan |
| 5 | Delivery Note | wh | list | Kirim barang ke pelanggan |
| 6 | Sales Invoice | fin | list | Tagih pelanggan |
| 7 | Payment Entry | fin | new | Catat penerimaan pembayaran |

### 4.2 Purchase — `Panduan Pembelian` (key `purchase`)
Lanes: Pembelian 🛒 (primary) · Gudang 📦 (wh) · Finance 💰 (fin)

| # | Stage (DocType) | Lane | Action | Desc (ID) |
|---|-----------------|------|--------|-----------|
| 1 | Material Request | primary | new | Ajukan permintaan barang |
| 2 | Request for Quotation | primary | list | Minta penawaran ke supplier |
| 3 | Supplier Quotation | primary | list | Terima & bandingkan penawaran |
| 4 | Purchase Order | primary | list | Pesan resmi ke supplier |
| 5 | Purchase Receipt | wh | list | Terima barang di gudang |
| 6 | Purchase Invoice | fin | list | Catat tagihan supplier |
| 7 | Payment Entry | fin | new | Bayar supplier |

### 4.3 Stock — `Panduan Persediaan` (key `stock`)
Lanes: Perencanaan 📋 (primary) · Gudang 📦 (wh) · Akuntansi 💰 (fin)

| # | Stage (DocType) | Lane | Action | Desc (ID) |
|---|-----------------|------|--------|-----------|
| 1 | Item | primary | list | Master barang & UOM |
| 2 | Material Request | primary | list | Permintaan stok antar gudang |
| 3 | Purchase Receipt | wh | list | Barang masuk |
| 4 | Stock Entry | wh | new | Transfer / penyesuaian stok |
| 5 | Delivery Note | wh | list | Barang keluar |
| 6 | Stock Reconciliation | fin | new | Opname & koreksi nilai |
| 7 | Stock Ledger | fin | report | Buku besar pergerakan stok |

> All DocType names are standard ERPNext (v13–v15). Routes auto-slugified by
> Frappe. `Stock Ledger` is a query report → `query-report` route.

## 5. Modern & elegant (token-based)

- Node = card on `--vd-card-bg`, `1px solid var(--vd-border)`, `--vd-radius`,
  subtle hover lift + accent left edge on hover.
- Connector lines + sequence numbers tinted `--vd-accent`.
- Lane label: uppercase, `--fs-xs`, `--vd-text-muted`, icon chip on `--vd-tint`.
- Page hero: title `--fs-2xl`, subtitle muted, short intro paragraph.
- Hub: 3 large cards (icon, title, one-line value), accent on hover.
- New tokens scoped under `.vd-guide` only, derived from `--vd-accent` — does
  NOT touch existing PRD `light_stripe` rules.
- Responsive: swimlane horizontally scrollable on narrow widths; lanes stack
  labels above nodes below ~900px.

## 6. Testing & verification (honest)

This checkout is NOT a bench (real bench = `erp.localhost` Docker /
`frappep3-bench`). Verifiable here:
- `node --check` on every `.js`.
- `python3 -m py_compile` on `__init__.py` + tests.
- JSON Page records valid + `standard:"Yes"` + name == page_name.
- `tests/test_guides.py`: every WORKFLOWS stage has non-empty doctype + valid
  lane id present in that workflow's `lanes`; every page dir has a matching JSON.

Runtime `/app/sales-guide` etc. requires the user's bench — will provide deploy
steps; will NOT claim "verified in Desk" without one.

## 7. Execution (parallel)

1. Pre-coding review panel (System Analyst: ERPNext flow correctness;
   Code Reviewer: SOLID/DRY/layer) — parallel.
2. Foundation: `vernon_desk_guides.{js,css}` (renderer + merged WORKFLOWS).
3. Fan-out: 4 pages (hub + sales + purchase + stock) built concurrently.
4. Wire `hooks.py` + `tests/test_guides.py`.
5. Adversarial verify: DocType/route correctness, SOLID/DRY/≤40-line, theme
   coverage, `node --check`, `py_compile`.

## 8. Files

| File | Change |
|------|--------|
| `public/js/vernon_desk_guides.js` | NEW — data + renderer |
| `public/css/vernon_desk_guides.css` | NEW — swimlane/hub styling |
| `vernon_desk/page/{vernon_onboarding,sales_guide,purchase_guide,stock_guide}/*` | NEW — 4 desk Pages |
| `hooks.py` | add guides css/js to `app_include_*` |
| `tests/test_guides.py` | NEW — integrity tests |

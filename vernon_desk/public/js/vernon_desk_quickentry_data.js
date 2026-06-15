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

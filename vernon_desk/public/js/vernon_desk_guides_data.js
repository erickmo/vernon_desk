/* ── Vernon Desk · Onboarding Guides — DATA layer ──────────────
 * Pure config consumed by vernon_desk_guides.js (the view). No logic,
 * no DOM, no server calls. Loaded BEFORE the view via app_include_js
 * so window.VernonDeskGuidesData is ready when the renderer runs.
 *
 * Each workflow: { title, subtitle, intro,
 *   lanes:  [{ id, role, icon }]                  (column order),
 *   stages: [{ label, doctype, lane, action, desc, tip }] }.
 * lane ids: primary (owning role) · wh (Gudang) · fin (Finance).
 * action values are validated by the view against NODE_ACTIONS.
 * ───────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    /* Allowed stage actions — the view branches on these named constants
       (no magic strings); an unknown/absent action degrades to List. */
    var NODE_ACTIONS = Object.freeze({ LIST: "list", NEW: "new", REPORT: "report" });

    var WORKFLOWS = {
        sales: {
            title: "Panduan Penjualan",
            subtitle: "Alur dokumen dari calon pelanggan hingga pembayaran",
            intro: "Panduan ini menelusuri alur penjualan ERPNext dari awal hingga akhir: mulai dari menangkap calon pelanggan, mengirim penawaran, mengonfirmasi pesanan, mengirim barang, sampai menagih dan menerima pembayaran. Ikuti tiap tahap secara berurutan agar setiap dokumen otomatis terhubung dan datanya konsisten.",
            lanes: [
                { id: "primary", role: "Penjualan", icon: "📈" },
                { id: "wh", role: "Gudang", icon: "📦" },
                { id: "fin", role: "Keuangan", icon: "💰" },
            ],
            stages: [
                { label: "Lead", doctype: "Lead", lane: "primary", action: "list", desc: "Tangkap calon pelanggan", tip: "Saat ada prospek baru yang belum tentu jadi pelanggan." },
                { label: "Opportunity", doctype: "Opportunity", lane: "primary", action: "list", desc: "Kualifikasi minat dan kebutuhan", tip: "Saat lead menunjukkan minat dan layak ditindaklanjuti lebih serius." },
                { label: "Quotation", doctype: "Quotation", lane: "primary", action: "new", desc: "Kirim penawaran harga", tip: "Saat pelanggan minta harga atau detail produk yang ditawarkan." },
                { label: "Sales Order", doctype: "Sales Order", lane: "primary", action: "list", desc: "Konfirmasi pesanan pelanggan", tip: "Saat pelanggan setuju penawaran dan resmi memesan barang." },
                { label: "Delivery Note", doctype: "Delivery Note", lane: "wh", action: "list", desc: "Kirim barang ke pelanggan", tip: "Saat barang siap dikirim dan stok keluar dari gudang." },
                { label: "Sales Invoice", doctype: "Sales Invoice", lane: "fin", action: "list", desc: "Tagih pelanggan", tip: "Saat barang terkirim dan pelanggan perlu ditagih pembayaran." },
                { label: "Payment Entry", doctype: "Payment Entry", lane: "fin", action: "new", desc: "Catat penerimaan pembayaran", tip: "Saat pelanggan membayar tagihan, catat uang masuk di sini." },
            ],
        },
        purchase: {
            title: "Panduan Pembelian",
            subtitle: "Alur dokumen procure-to-pay dari permintaan hingga pembayaran",
            intro: "Panduan ini menuntun Anda mengikuti alur pembelian standar ERPNext, mulai dari mengajukan permintaan barang sampai membayar supplier. Setiap dokumen mengalir ke tahap berikutnya, melibatkan tim Pembelian, Gudang, dan Finance secara berurutan.",
            lanes: [
                { id: "primary", role: "Pembelian", icon: "🛒" },
                { id: "wh", role: "Gudang", icon: "📦" },
                { id: "fin", role: "Finance", icon: "💰" },
            ],
            stages: [
                { label: "Material Request", doctype: "Material Request", lane: "primary", action: "new", desc: "Ajukan permintaan barang", tip: "Dipakai saat tim butuh barang yang stoknya menipis atau habis." },
                { label: "Request for Quotation", doctype: "Request for Quotation", lane: "primary", action: "list", desc: "Minta penawaran ke supplier", tip: "Dipakai saat ingin membandingkan harga dari beberapa supplier sekaligus." },
                { label: "Supplier Quotation", doctype: "Supplier Quotation", lane: "primary", action: "list", desc: "Terima dan bandingkan penawaran", tip: "Dipakai saat supplier sudah mengirim harga dan syarat penawaran." },
                { label: "Purchase Order", doctype: "Purchase Order", lane: "primary", action: "list", desc: "Pesan resmi ke supplier", tip: "Dipakai saat penawaran disetujui dan siap memesan barang secara resmi." },
                { label: "Purchase Receipt", doctype: "Purchase Receipt", lane: "wh", action: "list", desc: "Terima barang di gudang", tip: "Dipakai saat barang dari supplier tiba dan dicek di gudang." },
                { label: "Purchase Invoice", doctype: "Purchase Invoice", lane: "fin", action: "list", desc: "Catat tagihan supplier", tip: "Dipakai saat supplier mengirim tagihan atas barang yang sudah diterima." },
                { label: "Payment Entry", doctype: "Payment Entry", lane: "fin", action: "new", desc: "Bayar supplier", tip: "Dipakai saat tagihan jatuh tempo dan pembayaran dilakukan ke supplier." },
            ],
        },
        stock: {
            title: "Panduan Persediaan",
            subtitle: "Alur dokumen stok dari master sampai buku besar",
            intro: "Mulai dari mendaftarkan barang, lalu ajukan permintaan stok, terima barang masuk, atur transfer atau penyesuaian, dan catat barang keluar. Akhiri dengan opname dan periksa buku besar agar nilai serta jumlah stok selalu akurat.",
            lanes: [
                { id: "primary", role: "Perencanaan", icon: "📋" },
                { id: "wh", role: "Gudang", icon: "📦" },
                { id: "fin", role: "Akuntansi", icon: "💰" },
            ],
            stages: [
                { label: "Item", doctype: "Item", lane: "primary", action: "list", desc: "Master barang & satuan", tip: "Daftarkan saat ada produk atau bahan baru yang dikelola stok." },
                { label: "Material Request", doctype: "Material Request", lane: "primary", action: "list", desc: "Permintaan stok antar gudang", tip: "Buat saat butuh tambahan stok atau pindah barang antar gudang." },
                { label: "Purchase Receipt", doctype: "Purchase Receipt", lane: "wh", action: "list", desc: "Pencatatan barang masuk", tip: "Buat saat barang dari pemasok tiba dan diterima di gudang." },
                { label: "Stock Entry", doctype: "Stock Entry", lane: "wh", action: "new", desc: "Transfer atau penyesuaian stok", tip: "Pakai untuk pindah antar gudang, repack, atau koreksi jumlah stok." },
                { label: "Delivery Note", doctype: "Delivery Note", lane: "wh", action: "list", desc: "Pencatatan barang keluar", tip: "Buat saat mengirim barang ke pelanggan dari gudang." },
                { label: "Stock Reconciliation", doctype: "Stock Reconciliation", lane: "fin", action: "new", desc: "Opname & koreksi nilai", tip: "Pakai saat stok opname untuk menyamakan jumlah dan nilai sistem." },
                { label: "Stock Ledger", doctype: "Stock Ledger", lane: "fin", action: "report", desc: "Buku besar pergerakan stok", tip: "Buka untuk menelusuri riwayat masuk-keluar dan saldo tiap barang." },
            ],
        },
    };

    /* Hub index cards — route = the desk Page slug for each workflow. */
    var HUB_CARDS = [
        { key: "sales", route: "sales-guide", icon: "📈" },
        { key: "purchase", route: "purchase-guide", icon: "🛒" },
        { key: "stock", route: "stock-guide", icon: "📦" },
    ];

    window.VernonDeskGuidesData = {
        NODE_ACTIONS: NODE_ACTIONS,
        WORKFLOWS: WORKFLOWS,
        HUB_CARDS: HUB_CARDS,
    };
})();

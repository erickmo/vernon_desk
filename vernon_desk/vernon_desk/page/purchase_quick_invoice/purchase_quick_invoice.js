/* Desk Page: Faktur Pembelian Cepat. Thin shell over the shared
   VernonDeskQuickEntry bundle (app_include_js). Bounded retry mount with a
   visible fallback if the bundle never loads (same pattern as the guides). */
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

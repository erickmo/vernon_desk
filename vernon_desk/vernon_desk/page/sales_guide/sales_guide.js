/* Desk Page: Panduan Penjualan. Thin shell over the shared
   VernonDeskGuides bundle (app_include_js). Bounded retry: the bundle
   loads at desk boot so it is normally ready immediately; if a broken or
   un-built asset never defines it, show a visible fallback instead of
   spinning a timer forever. */
frappe.pages["sales-guide"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Panduan Penjualan"),
        single_column: true,
    });
    var tries = 0;
    (function mount() {
        if (window.VernonDeskGuides) return window.VernonDeskGuides.render(page.main, "sales");
        if (++tries > 50) {
            return page.main.html(
                '<div class="vd-guide"><div class="vd-node" style="cursor:default">' +
                '<div class="vd-node__label">⚠️ Gagal memuat panduan. Jalankan bench build lalu refresh.</div>' +
                "</div></div>"
            );
        }
        setTimeout(mount, 60);
    })();
};

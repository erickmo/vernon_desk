/* Desk Page: Panduan Onboarding (hub). Thin shell over the shared
   VernonDeskGuides bundle (app_include_js). Bounded retry: the bundle
   loads at desk boot so it is normally ready immediately; if a broken or
   un-built asset never defines it, show a visible fallback instead of
   spinning a timer forever. */
frappe.pages["vernon-onboarding"].on_page_load = function (wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __("Panduan Onboarding"),
        single_column: true,
    });
    var tries = 0;
    (function mount() {
        if (window.VernonDeskGuides) return window.VernonDeskGuides.renderHub(page.main);
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

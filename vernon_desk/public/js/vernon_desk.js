frappe.provide("vernon_desk");

/* ── Module icon map ────────────────────────────────────────── */
const VD_ICONS = {
    "accounts":      "💰", "accounting":    "💰",
    "stock":         "📦", "inventory":     "📦", "warehouse":   "📦",
    "manufacturing": "🏭", "production":    "🏭",
    "hr":            "👥", "payroll":        "👥", "human resources": "👥",
    "projects":      "📋", "project":        "📋",
    "sales":         "📈", "selling":        "📈",
    "purchase":      "🛒", "buying":         "🛒",
    "crm":           "🤝",
    "support":       "🎧",
    "setup":         "⚙️", "settings":      "⚙️",
    "website":       "🌐",
    "assets":        "🏢",
    "quality":       "✅",
    "loans":         "🏦",
    "workforce":     "👔",
    "tasks":         "✅",
    "okr":           "🎯",
    "chat":          "💬",
    "desk":          "🖥️",
};

function vd_icon(label) {
    const key = (label || "").toLowerCase();
    for (const [k, v] of Object.entries(VD_ICONS)) {
        if (key.includes(k)) return v;
    }
    return "📄";
}

function vd_el(tag, attrs, text) {
    const el = document.createElement(tag);
    if (attrs) {
        for (const [k, v] of Object.entries(attrs)) {
            if (k === "class") el.className = v;
            else el.setAttribute(k, v);
        }
    }
    if (text) el.textContent = text;
    return el;
}

/* ── Main object ────────────────────────────────────────────── */
vernon_desk = {
    _nav2_bound: false,

    init() {
        /* toolbar_setup fires after Frappe renders navbar HTML into DOM */
        $(document).on("toolbar_setup", () => {
            this.apply_theme();
            this.setup_nav1();
            this.setup_nav2();
            this.bind_route_change();
        });
    },

    apply_theme() {
        const theme =
            (frappe.boot.vernon_desk && frappe.boot.vernon_desk.theme) ||
            "cosmic_ocean";
        document.documentElement.setAttribute("data-vd-theme", theme);
    },

    /* ── Nav1 ──────────────────────────────────────────────── */
    setup_nav1() {
        this.inject_logo();
        this.inject_main_menu();
    },

    inject_logo() {
        const brand = document.querySelector(".navbar-brand.navbar-home");
        if (!brand || document.getElementById("vd-logo")) return;

        const logo = vd_el("a", { id: "vd-logo", href: "/" });
        logo.appendChild(vd_el("span", { id: "vd-logo-mark" }, "V"));
        logo.appendChild(vd_el("span", {}, "Vernon"));
        brand.after(logo);
    },

    inject_main_menu() {
        const container = document.querySelector(".navbar .container");
        if (!container || document.getElementById("vd-main-menu-btn")) return;

        const ns = "http://www.w3.org/2000/svg";

        /* ── Button ── */
        const btn = vd_el("button", {
            id: "vd-main-menu-btn",
            "aria-expanded": "false",
            "aria-label": "Toggle applications menu",
        });

        const menuSvg = document.createElementNS(ns, "svg");
        menuSvg.setAttribute("viewBox", "0 0 16 16");
        menuSvg.setAttribute("fill", "currentColor");
        menuSvg.setAttribute("width", "14");
        menuSvg.setAttribute("height", "14");
        [["0", "2.5"], ["0", "7.25"], ["0", "12"]].forEach(([x, y]) => {
            const r = document.createElementNS(ns, "rect");
            r.setAttribute("x", x); r.setAttribute("y", y);
            r.setAttribute("width", "16"); r.setAttribute("height", "1.5");
            r.setAttribute("rx", "0.75");
            menuSvg.appendChild(r);
        });
        btn.appendChild(menuSvg);
        btn.appendChild(vd_el("span", {}, "Apps"));

        const chSvg = document.createElementNS(ns, "svg");
        chSvg.id = "vd-chevron";
        chSvg.setAttribute("viewBox", "0 0 16 16");
        chSvg.setAttribute("fill", "none");
        chSvg.setAttribute("width", "12");
        chSvg.setAttribute("height", "12");
        const chPath = document.createElementNS(ns, "path");
        chPath.setAttribute("d", "M4 6l4 4 4-4");
        chPath.setAttribute("stroke", "currentColor");
        chPath.setAttribute("stroke-width", "1.5");
        chPath.setAttribute("stroke-linecap", "round");
        chPath.setAttribute("stroke-linejoin", "round");
        chSvg.appendChild(chPath);
        btn.appendChild(chSvg);

        /* ── Dropdown ── */
        const dropdown = vd_el("div", { id: "vd-main-menu-dropdown" });
        dropdown.appendChild(vd_el("div", { id: "vd-dropdown-label" }, "Applications"));

        const grid = vd_el("div", { id: "vd-module-grid" });
        const workspaces = (frappe.boot && frappe.boot.allowed_workspaces) || [];
        const seen = new Set();
        workspaces.forEach((ws) => {
            if (!ws.module || seen.has(ws.module)) return;
            seen.add(ws.module);
            const card = vd_el("a", {
                class: "vd-module-card",
                href: "/app/" + frappe.router.slug(ws.name),
            });
            card.appendChild(vd_el("span", { class: "vd-module-icon" }, vd_icon(ws.module)));
            card.appendChild(vd_el("span", {}, ws.module));
            grid.appendChild(card);
        });
        dropdown.appendChild(grid);

        /* ── Toggle logic ── */
        const closeMenu = () => {
            dropdown.classList.remove("open");
            btn.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
        };

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const open = dropdown.classList.toggle("open");
            btn.classList.toggle("open", open);
            btn.setAttribute("aria-expanded", String(open));
        });

        document.addEventListener("click", closeMenu);
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });
        grid.addEventListener("click", closeMenu);

        container.appendChild(btn);
        document.body.appendChild(dropdown);
    },

    /* ── Nav2 ──────────────────────────────────────────────── */
    setup_nav2() {
        const stickyTop = document.querySelector(".sticky-top");
        if (!stickyTop || document.getElementById("vd-nav2")) return;
        stickyTop.appendChild(vd_el("div", { id: "vd-nav2", class: "empty" }));
    },

    bind_route_change() {
        if (this._nav2_bound) return;
        this._nav2_bound = true;

        $(document).on("page-change", () => {
            this.render_nav2(frappe.get_route());
        });

        this.render_nav2(frappe.get_route());
    },

    render_nav2(route) {
        const nav2 = document.getElementById("vd-nav2");
        if (!nav2) return;

        const module = this.get_module_from_route(route);
        const items  = this.get_module_pages(module);

        while (nav2.firstChild) nav2.removeChild(nav2.firstChild);

        if (!items || items.length === 0) {
            nav2.classList.add("empty");
            return;
        }

        nav2.classList.remove("empty");

        if (module) {
            nav2.appendChild(vd_el("span", { class: "vd-nav2-label" }, this.slug_to_title(module)));
            nav2.appendChild(vd_el("span", { class: "vd-nav2-divider" }));
        }

        const currentPath = window.location.pathname;
        items.forEach((item) => {
            nav2.appendChild(vd_el("a", {
                class: "vd-nav2-item" + (currentPath.includes(item.route) ? " active" : ""),
                href: item.route,
            }, item.label));
        });
    },

    get_module_from_route(route) {
        if (!route || !route.length) return null;
        if (route[0] === "app" && route[1]) return route[1];
        return route[0] || null;
    },

    get_module_pages(moduleSlug) {
        if (!moduleSlug || !frappe.router || typeof frappe.router.slug !== "function") return [];
        const mww = (frappe.boot && frappe.boot.module_wise_workspaces) || {};
        const matchedKey = Object.keys(mww).find(
            (key) => frappe.router.slug(key) === moduleSlug
        );
        if (!matchedKey) return [];
        return mww[matchedKey].map((wsName) => ({
            label: wsName,
            route: "/app/" + frappe.router.slug(wsName),
        }));
    },

    slug_to_title(slug) {
        return slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    },
};

vernon_desk.init();

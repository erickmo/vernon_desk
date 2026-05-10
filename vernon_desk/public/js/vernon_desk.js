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

/* chevron svg */
function vd_chevron_svg(cls) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("width", "10"); svg.setAttribute("height", "10");
    if (cls) svg.setAttribute("class", cls);
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M4 6l4 4 4-4");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
}

/* ── Main object ────────────────────────────────────────────── */
vernon_desk = {
    _nav2_bound: false,
    _nm_open: null,

    init() {
        $(document).on("toolbar_setup", () => {
            this.apply_theme();
            this.setup_nav1();
            this.setup_nav_main();
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
    },

    inject_logo() {
        const brand = document.querySelector(".navbar-brand.navbar-home");
        if (!brand || document.getElementById("vd-logo")) return;
        const logo = vd_el("a", { id: "vd-logo", href: "/" });
        logo.appendChild(vd_el("span", { id: "vd-logo-mark" }, "V"));
        logo.appendChild(vd_el("span", {}, "Vernon"));
        brand.after(logo);
    },

    /* ── Nav-main: module bar with dropdowns ───────────────── */
    setup_nav_main() {
        const stickyTop = document.querySelector(".sticky-top");
        if (!stickyTop || document.getElementById("vd-nav-main")) return;

        const workspaces = (frappe.boot && frappe.boot.allowed_workspaces) || [];
        if (!workspaces.length) return;

        /* Group workspaces by module */
        const modules = new Map();
        workspaces.forEach((ws) => {
            if (!ws.module) return;
            if (!modules.has(ws.module)) modules.set(ws.module, []);
            modules.get(ws.module).push(ws);
        });

        const nav = vd_el("nav", { id: "vd-nav-main" });
        const scroll = vd_el("div", { id: "vd-nm-scroll" });

        modules.forEach((wsList, moduleName) => {
            const item = vd_el("div", { class: "vd-nm-item" });

            const trigger = vd_el("button", { class: "vd-nm-trigger" });
            trigger.appendChild(vd_el("span", {}, moduleName));
            trigger.appendChild(vd_chevron_svg("vd-nm-chevron"));
            item.appendChild(trigger);

            const dropdown = vd_el("div", { class: "vd-nm-dropdown" });
            wsList.forEach((ws) => {
                const link = vd_el("a", {
                    class: "vd-nm-dd-item",
                    href: "/app/" + frappe.router.slug(ws.name),
                });
                link.appendChild(vd_el("span", { class: "vd-nm-dd-icon" }, vd_icon(ws.module)));
                link.appendChild(vd_el("span", {}, ws.name));
                dropdown.appendChild(link);
            });
            item.appendChild(dropdown);

            /* Toggle on click — teleport dropdown to body to escape overflow clipping */
            trigger.addEventListener("click", (e) => {
                e.stopPropagation();
                const isOpen = this._nm_open && this._nm_open.trigger === trigger;
                this._close_nm_all();
                if (!isOpen) {
                    const rect = trigger.getBoundingClientRect();
                    dropdown.style.cssText = [
                        "position:fixed",
                        `top:${rect.bottom + 4}px`,
                        `left:${rect.left}px`,
                        "z-index:9999",
                    ].join(";");
                    document.body.appendChild(dropdown);
                    dropdown.classList.add("open");
                    trigger.classList.add("open");
                    this._nm_open = { dropdown, trigger, item };
                }
            });

            scroll.appendChild(item);
        });

        nav.appendChild(scroll);

        /* Close on outside click */
        document.addEventListener("click", () => this._close_nm_all());
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this._close_nm_all();
        });

        /* Insert right after .navbar */
        const navbar = stickyTop.querySelector(".navbar");
        if (navbar && navbar.nextSibling) {
            stickyTop.insertBefore(nav, navbar.nextSibling);
        } else {
            stickyTop.appendChild(nav);
        }
    },

    _close_nm_all() {
        if (!this._nm_open) return;
        const { dropdown, trigger, item } = this._nm_open;
        dropdown.classList.remove("open");
        trigger.classList.remove("open");
        dropdown.style.cssText = "";
        item.appendChild(dropdown);
        this._nm_open = null;
    },

    _update_nm_active(route) {
        const nav = document.getElementById("vd-nav-main");
        if (!nav) return;

        const workspaceSlug = route && route[0] === "app" ? route[1] : null;
        const workspaces = (frappe.boot && frappe.boot.allowed_workspaces) || [];
        const ws = workspaces.find(
            (w) => frappe.router && frappe.router.slug(w.name) === workspaceSlug
        );
        const activeModule = ws && ws.module;

        nav.querySelectorAll(".vd-nm-trigger").forEach((trigger) => {
            const moduleName = trigger.querySelector("span:first-child").textContent;
            trigger.classList.toggle("active", moduleName === activeModule);
        });

        /* Also update active dd-item */
        nav.querySelectorAll(".vd-nm-dd-item").forEach((link) => {
            link.classList.toggle(
                "active",
                workspaceSlug && link.getAttribute("href").includes(workspaceSlug)
            );
        });
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
            const route = frappe.get_route();
            this.render_nav2(route);
            this._update_nm_active(route);
        });
        const r = frappe.get_route();
        this.render_nav2(r);
        this._update_nm_active(r);
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

    get_module_pages(workspaceSlug) {
        if (!workspaceSlug || !frappe.router || typeof frappe.router.slug !== "function") return [];
        const workspaces = (frappe.boot && frappe.boot.allowed_workspaces) || [];
        const ws = workspaces.find(
            (w) => frappe.router.slug(w.name) === workspaceSlug
        );
        const moduleName = ws && ws.module;
        if (!moduleName) return [];
        return workspaces
            .filter((w) => w.module === moduleName)
            .map((w) => ({
                label: w.name,
                route: "/app/" + frappe.router.slug(w.name),
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

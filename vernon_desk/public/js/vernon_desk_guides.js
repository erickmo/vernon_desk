/* ── Vernon Desk · Onboarding Guides — VIEW layer ──────────────
 * Role-swimlane workflow visualizers for ERPNext Sales / Purchase /
 * Stock, plus an onboarding hub. Each stage deep-links to the real
 * ERPNext DocType so the guide teaches the system AND launches work.
 *
 * Layer: VIEW only. No business logic, no server calls, no mutable
 * module state — every builder is pure (inputs -> DOM). The only
 * behavior (navigation) is isolated in route_node(). Config data lives
 * in vernon_desk_guides_data.js (loaded first via app_include_js).
 * Theming uses the existing --vd-* CSS vars (see vernon_desk_guides.css)
 * so all 5 Vernon Desk themes work with no extra CSS.
 *
 * Public API: window.VernonDeskGuides
 *   .render(body, key)  → swimlane for WORKFLOWS[key]
 *   .renderHub(body)    → 3-card onboarding index
 * ───────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    /* Pure config from the data layer (vernon_desk_guides_data.js). */
    var DATA = window.VernonDeskGuidesData || { NODE_ACTIONS: {}, WORKFLOWS: {}, HUB_CARDS: [] };
    var NODE_ACTIONS = DATA.NODE_ACTIONS;
    var WORKFLOWS = DATA.WORKFLOWS;
    var HUB_CARDS = DATA.HUB_CARDS;

    /* ── Helpers ─────────────────────────────────────────────────── */

    /* Create an element with an optional class and text (textContent —
       never innerHTML, so workflow copy needs no HTML escaping). */
    function g_el(tag, cls, text) {
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

    /* ── Routing (the ONLY behavior) ─────────────────────────────
     * Map a stage's action -> the matching Frappe navigation. Unknown
     * actions fall through to the List view so a data typo never
     * dead-clicks. Kept out of the builders to keep the view pure. */
    function route_node(doctype, action) {
        if (!doctype) return;
        if (action === NODE_ACTIONS.REPORT) {
            frappe.set_route("query-report", doctype);
        } else if (action === NODE_ACTIONS.NEW) {
            frappe.new_doc(doctype);
        } else {
            frappe.set_route("List", doctype);
        }
    }

    /* CTA wording per action (Bahasa Indonesia). */
    function cta_label(action) {
        if (action === NODE_ACTIONS.NEW) return "Buat baru";
        if (action === NODE_ACTIONS.REPORT) return "Buka laporan";
        return "Buka daftar";
    }

    /* Warn (console-only) on data that would silently misrender: a stage
       whose lane has no matching lane id, or an unknown action. */
    function validate_workflow(wf) {
        var lane_ids = wf.lanes.map(function (l) { return l.id; });
        var actions = Object.keys(NODE_ACTIONS).map(function (k) { return NODE_ACTIONS[k]; });
        wf.stages.forEach(function (s) {
            if (lane_ids.indexOf(s.lane) === -1) {
                console.warn("[VernonDeskGuides] orphan stage (lane not found):", s.label, s.lane);
            }
            if (actions.indexOf(s.action) === -1) {
                console.warn("[VernonDeskGuides] unknown action -> List fallback:", s.label, s.action);
            }
        });
    }

    /* ── Builders (pure: inputs -> Element) ──────────────────────── */

    function build_hero(wf, eyebrow) {
        var hero = g_el("div", "vd-guide__hero");
        hero.appendChild(g_el("span", "vd-guide__eyebrow", eyebrow));
        hero.appendChild(g_el("h1", "vd-guide__title", wf.title));
        if (wf.subtitle) hero.appendChild(g_el("p", "vd-guide__subtitle", wf.subtitle));
        if (wf.intro) hero.appendChild(g_el("p", "vd-guide__intro", wf.intro));
        return hero;
    }

    function build_legend(lanes) {
        var legend = g_el("div", "vd-guide__legend");
        lanes.forEach(function (lane) {
            var chip = g_el("span", "vd-lane-chip");
            chip.appendChild(g_el("span", "vd-lane-chip__icon", lane.icon));
            chip.appendChild(g_el("span", null, lane.role));
            legend.appendChild(chip);
        });
        return legend;
    }

    function build_node(stage, icon) {
        var node = g_el("button", "vd-node");
        node.type = "button";
        node.dataset.doctype = stage.doctype;                 // read by delegation
        node.dataset.action = stage.action || NODE_ACTIONS.LIST;
        var head = g_el("div", "vd-node__head");
        head.appendChild(g_el("span", "vd-node__icon", icon));
        head.appendChild(g_el("span", "vd-node__label", stage.label));
        node.appendChild(head);
        if (stage.desc) node.appendChild(g_el("div", "vd-node__desc", stage.desc));
        if (stage.tip) node.appendChild(g_el("div", "vd-node__tip", stage.tip));
        node.appendChild(g_el("span", "vd-node__cta", cta_label(stage.action)));
        return node;
    }

    /* One swimlane row cell: the node when the stage belongs to this
       lane, otherwise a faint connector placeholder. */
    function build_cell(stage, lane) {
        if (stage.lane !== lane.id) return g_el("div", "vd-swim__cell is-empty");
        var cell = g_el("div", "vd-swim__cell");
        cell.appendChild(build_node(stage, lane.icon));
        return cell;
    }

    function build_lane_label(lane) {
        var cell = g_el("div", "vd-swim__lane");
        cell.appendChild(g_el("span", "vd-swim__lane-icon", lane.icon));
        cell.appendChild(g_el("span", null, lane.role));
        return cell;
    }

    /* Step-header row badge (1..n) above each stage column. */
    function build_step(index) {
        var step = g_el("div", "vd-swim__step");
        step.appendChild(g_el("span", "vd-swim__num", String(index + 1)));
        return step;
    }

    /* The swimlane grid: header row of step badges + one row per lane. */
    function build_swim(wf) {
        var stages = wf.stages;
        var grid = g_el("div", "vd-swim");
        grid.style.gridTemplateColumns =
            "var(--g-lane-w) repeat(" + stages.length + ", minmax(150px, 1fr))";
        grid.appendChild(g_el("div", "vd-swim__corner"));
        stages.forEach(function (_, i) { grid.appendChild(build_step(i)); });
        wf.lanes.forEach(function (lane) {
            grid.appendChild(build_lane_label(lane));
            stages.forEach(function (stage) { grid.appendChild(build_cell(stage, lane)); });
        });
        var scroll = g_el("div", "vd-swim__scroll");
        scroll.appendChild(grid);
        return scroll;
    }

    function error_node(message) {
        var el = g_el("div", "vd-node");
        el.style.cursor = "default";
        el.appendChild(g_el("div", "vd-node__label", "⚠️ " + message));
        return el;
    }

    /* Hub card -> navigates to the workflow's desk Page on click. */
    function build_hub_card(card, wf) {
        var el = g_el("button", "vd-hub__card");
        el.type = "button";
        el.dataset.route = card.route;
        el.appendChild(g_el("span", "vd-hub__icon", card.icon));
        el.appendChild(g_el("span", "vd-hub__title", wf.title));
        el.appendChild(g_el("span", "vd-hub__desc", wf.subtitle || ""));
        el.appendChild(g_el("span", "vd-hub__meta", wf.stages.length + " tahap →"));
        return el;
    }

    /* ── Event delegation ────────────────────────────────────────
     * One listener per rendered root. render() always builds a FRESH
     * root, so the old root + its listener are GC'd — render() stays
     * idempotent across Frappe SPA show/hide (no listener buildup). */
    function bind_node_clicks(root) {
        root.addEventListener("click", function (ev) {
            var node = ev.target.closest(".vd-node");
            if (node && root.contains(node)) {
                route_node(node.dataset.doctype, node.dataset.action);
            }
        });
    }

    function bind_hub_clicks(root) {
        root.addEventListener("click", function (ev) {
            var card = ev.target.closest(".vd-hub__card");
            if (card && root.contains(card)) frappe.set_route(card.dataset.route);
        });
    }

    /* ── Public renderers ────────────────────────────────────────── */

    function render(body, key) {
        var root = normalize(body);
        if (!root) return;
        root.innerHTML = "";
        var wrap = g_el("div", "vd-guide");
        var wf = WORKFLOWS[key];
        if (!wf) {
            wrap.appendChild(error_node('Panduan "' + key + '" tidak ditemukan.'));
            root.appendChild(wrap);
            return;
        }
        validate_workflow(wf);
        wrap.appendChild(build_hero(wf, "Panduan Onboarding"));
        wrap.appendChild(build_legend(wf.lanes));
        wrap.appendChild(build_swim(wf));
        bind_node_clicks(wrap);
        root.appendChild(wrap);
    }

    function render_hub(body) {
        var root = normalize(body);
        if (!root) return;
        root.innerHTML = "";
        var wrap = g_el("div", "vd-hub vd-guide");
        var hero = g_el("div", "vd-guide__hero");
        hero.appendChild(g_el("span", "vd-guide__eyebrow", "Mulai Di Sini"));
        hero.appendChild(g_el("h1", "vd-guide__title", "Panduan Onboarding ERPNext"));
        hero.appendChild(g_el("p", "vd-guide__intro",
            "Pahami alur kerja inti ERPNext lewat visualisasi peran. Pilih satu alur untuk mulai."));
        wrap.appendChild(hero);
        var grid = g_el("div", "vd-hub__grid");
        HUB_CARDS.forEach(function (card) {
            var wf = WORKFLOWS[card.key];
            if (wf) grid.appendChild(build_hub_card(card, wf));
        });
        wrap.appendChild(grid);
        bind_hub_clicks(wrap);
        root.appendChild(wrap);
    }

    window.VernonDeskGuides = {
        render: render,
        renderHub: render_hub,
        WORKFLOWS: WORKFLOWS,
        NODE_ACTIONS: NODE_ACTIONS,
    };
})();

/* ── Vernon Desk · Quick Entry — VIEW layer ────────────────────
 * Simplified single-doctype entry forms for Sales Invoice / Purchase
 * Invoice / Stock Entry / Payment Entry. Builds a minimal form from the
 * config in vernon_desk_quickentry_data.js using NATIVE Frappe controls,
 * then creates the real document via frappe.client.insert — so all taxes,
 * GL and stock logic stays in the ERPNext server controllers.
 *
 * Layer: VIEW only. Builders are pure (config -> DOM). The ONLY behavior
 * is the save handler (insert/submit), kept isolated in save_doc().
 * Theming uses the existing --vd-* CSS vars (vernon_desk_quickentry.css).
 *
 * Public API: window.VernonDeskQuickEntry
 *   .render(body, key)  → quick-entry form for FORMS[key]
 * ───────────────────────────────────────────────────────────── */
(function () {
    "use strict";

    var DATA = window.VernonDeskQuickEntryData || { FIELDTYPES: {}, FORMS: {} };
    var FORMS = DATA.FORMS;

    /* ── Helpers ─────────────────────────────────────────────────── */

    /* Create an element with optional class + text (textContent, no escaping). */
    function qe_el(tag, cls, text) {
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

    /* True when a control value counts as unset — used so a numeric 0 is NOT
       treated as missing (paid_amount, qty, rate). */
    function is_empty(v) {
        return v === "" || v == null;
    }

    /* Resolve a field's default into a concrete value ("Today" -> date). Only
       "Today" is a supported dynamic token; all other defaults pass literally. */
    function default_value(df) {
        if (df.default === "Today") return frappe.datetime.get_today();
        return df.default != null ? df.default : "";
    }

    /* The Link target for a field: static options, or a dynamic doctype pulled
       from a sibling field's current value (options_from). */
    function link_target(df, get_sibling) {
        if (df.options) return df.options;
        if (df.options_from && get_sibling) return get_sibling(df.options_from);
        return "";
    }

    /* ── Control building (native Frappe controls) ───────────────── */

    /* Build one Frappe control into `parent`; return the control object. Read
       via control.get_value(), write via set_value(). render_input already
       renders the input, so we only set a value when a real default exists
       (setting "" on a fresh Link would leave a stale awesomplete). */
    function make_field(parent, df, get_sibling) {
        var resolved = Object.assign({}, df);
        if (df.fieldtype === "Link") resolved.options = link_target(df, get_sibling);
        var control = frappe.ui.form.make_control({
            parent: parent, df: resolved, render_input: true,
        });
        var dv = default_value(df);
        if (!is_empty(dv)) control.set_value(dv);
        return control;
    }

    /* ── Builders (pure: config -> Element, controls captured by ref) ── */

    function build_header(cfg) {
        var head = qe_el("div", "vd-qe__head");
        head.appendChild(qe_el("h1", "vd-qe__title", cfg.title));
        head.appendChild(qe_el("p", "vd-qe__subtitle", cfg.doctype));
        return head;
    }

    /* When a dependent field's source (options_from) actually changes value,
       repoint the dependent Link's doctype + clear it. The last-value guard
       stops programmatic/refresh change events from wiping a typed value. */
    function wire_dynamic_link(controls, df) {
        var src = controls[df.options_from];
        var dep = controls[df.fieldname];
        if (!src || !dep) return;
        dep.df.options = src.get_value() || "";          // seed to source default
        var last = src.get_value();
        function repoint() {
            var v = src.get_value();
            if (v === last) return;
            last = v;
            dep.df.options = v || "";
            dep.set_value("");
            dep.refresh();
        }
        if (src.$input) src.$input.on("change", repoint);
    }

    /* Parent field grid; captures each control into `controls` by fieldname. */
    function build_fields(cfg, controls) {
        var grid = qe_el("div", "vd-qe__grid");
        function get_sibling(fieldname) {
            return controls[fieldname] ? controls[fieldname].get_value() : "";
        }
        cfg.fields.forEach(function (df) {
            var cell = qe_el("div", "vd-qe__field");
            controls[df.fieldname] = make_field(cell, df, get_sibling);
            grid.appendChild(cell);
        });
        cfg.fields.forEach(function (df) {
            if (df.options_from) wire_dynamic_link(controls, df);
        });
        return grid;
    }

    /* ── Child table (dynamic rows) ──────────────────────────────── */

    /* Returns { el, rows }; rows is a live array of { controls } mutated by
       add/remove. min_rows is the floor remove_row refuses to go below. */
    function build_child(child) {
        var rows = [];
        var floor = Math.max(child.min_rows || 0, 0);
        var section = qe_el("div", "vd-qe__child");
        section.appendChild(qe_el("h2", "vd-qe__child-title", child.label));
        var list = qe_el("div", "vd-qe__rows");
        section.appendChild(list);

        function remove_row(entry, row) {
            if (rows.length <= floor) {
                frappe.show_alert({ message: __("Minimal {0} baris", [floor]), indicator: "orange" });
                return;
            }
            rows.splice(rows.indexOf(entry), 1);
            row.remove();
        }

        function add_row() {
            var row = qe_el("div", "vd-qe__row");
            var entry = { controls: {} };
            child.fields.forEach(function (df) {
                var cell = qe_el("div", "vd-qe__cell");
                entry.controls[df.fieldname] = make_field(cell, df, null);
                row.appendChild(cell);
            });
            var del = qe_el("button", "vd-qe__row-del", "✕");
            del.type = "button";
            del.addEventListener("click", function () { remove_row(entry, row); });
            row.appendChild(del);
            list.appendChild(row);
            rows.push(entry);
        }

        var add = qe_el("button", "vd-qe__add", "+ Tambah baris");
        add.type = "button";
        add.addEventListener("click", add_row);
        section.appendChild(add);

        for (var i = 0; i < floor; i++) add_row();
        return { el: section, rows: rows };
    }

    /* ── Validation + collection ─────────────────────────────────── */

    /* Return a list of missing required-field labels; mark empty controls.
       Uses is_empty so a deliberate 0 is never flagged as missing. */
    function validate(cfg, controls, child_rows) {
        var missing = [];
        cfg.fields.forEach(function (df) {
            var ctrl = controls[df.fieldname];
            if (df.reqd && is_empty(ctrl.get_value())) {
                missing.push(df.label);
                if (ctrl.$wrapper) ctrl.$wrapper.addClass("has-error");
            }
        });
        if (cfg.needs_company && !frappe.defaults.get_user_default("Company")) {
            missing.push(__("Perusahaan (atur Default Company di Pengaturan)"));
        }
        if (cfg.child) {
            child_rows.forEach(function (entry, idx) {
                cfg.child.fields.forEach(function (df) {
                    if (df.reqd && is_empty(entry.controls[df.fieldname].get_value())) {
                        missing.push(cfg.child.label + " #" + (idx + 1) + ": " + df.label);
                    }
                });
            });
        }
        return missing;
    }

    /* Assemble the document payload from parent controls + child rows. Keeps a
       value of 0 (is_empty(0) is false); omits only blank/null fields. */
    function collect(cfg, controls, child_rows) {
        var doc = { doctype: cfg.doctype };
        cfg.fields.forEach(function (df) {
            var v = controls[df.fieldname].get_value();
            if (!is_empty(v)) doc[df.fieldname] = v;
        });
        if (cfg.child) {
            doc[cfg.child.table_field] = child_rows.map(function (entry) {
                var row = {};
                cfg.child.fields.forEach(function (df) {
                    var v = entry.controls[df.fieldname].get_value();
                    if (!is_empty(v)) row[df.fieldname] = v;
                });
                return row;
            });
        }
        if (cfg.needs_company) {
            var company = frappe.defaults.get_user_default("Company");
            if (company) doc.company = company;
        }
        return doc;
    }

    /* ── Behavior: the ONE async action ──────────────────────────── */

    /* Validate, insert via the generic client API (server controllers do all
       business logic), optionally submit, then announce + reset. */
    function save_doc(cfg, controls, child_rows, do_submit, on_done) {
        var missing = validate(cfg, controls, child_rows);
        if (missing.length) {
            frappe.show_alert({ message: __("Lengkapi: {0}", [missing.join(", ")]), indicator: "red" });
            return;
        }
        var doc = collect(cfg, controls, child_rows);
        frappe.dom.freeze(__("Menyimpan…"));
        frappe.call({ method: "frappe.client.insert", args: { doc: doc } })
            .then(function (r) {
                var created = r && r.message;
                if (!created) return;
                if (do_submit && cfg.submittable) {
                    return frappe.call({ method: "frappe.client.submit", args: { doc: created } })
                        .then(function () { announce(cfg, created); on_done(); });
                }
                announce(cfg, created);
                on_done();
            })
            .always(function () { frappe.dom.unfreeze(); });
    }

    /* Success toast linking to the created document (name HTML-escaped). */
    function announce(cfg, created) {
        var href = "/app/" + frappe.router.slug(cfg.doctype) + "/" + encodeURIComponent(created.name);
        frappe.show_alert({
            message: __("Dibuat: {0}", ['<a href="' + href + '">' + frappe.utils.escape_html(created.name) + "</a>"]),
            indicator: "green",
        }, 7);
    }

    /* ── Footer ──────────────────────────────────────────────────── */

    function build_footer(cfg, on_save, on_submit) {
        var footer = qe_el("div", "vd-qe__footer");
        var save = qe_el("button", "btn btn-default vd-qe__btn", "Simpan");
        save.type = "button";
        save.addEventListener("click", on_save);
        footer.appendChild(save);
        if (cfg.submittable) {
            var submit = qe_el("button", "btn btn-primary vd-qe__btn", "Simpan & Ajukan");
            submit.type = "button";
            submit.addEventListener("click", on_submit);
            footer.appendChild(submit);
        }
        return footer;
    }

    /* ── Public renderer ─────────────────────────────────────────── */

    /* Render the quick-entry form for FORMS[key] into body. Idempotent:
       $(root).empty() tears down prior controls + their handlers (avoids
       listener buildup when reset() re-renders after each save). */
    function render(body, key) {
        var root = normalize(body);
        if (!root) return;
        if (window.$) window.$(root).empty();
        else while (root.firstChild) root.removeChild(root.firstChild);
        var wrap = qe_el("div", "vd-qe");
        var cfg = FORMS[key];
        if (!cfg) {
            wrap.appendChild(qe_el("div", "vd-qe__error", '⚠️ Form "' + key + '" tidak ditemukan.'));
            root.appendChild(wrap);
            return;
        }
        var controls = {};
        var child_built = cfg.child ? build_child(cfg.child) : null;
        var child_rows = child_built ? child_built.rows : [];

        wrap.appendChild(build_header(cfg));
        wrap.appendChild(build_fields(cfg, controls));
        if (child_built) wrap.appendChild(child_built.el);

        function reset() { render(root, key); }                 // idempotent rebuild
        wrap.appendChild(build_footer(
            cfg,
            function () { save_doc(cfg, controls, child_rows, false, reset); },
            function () { save_doc(cfg, controls, child_rows, true, reset); }
        ));
        root.appendChild(wrap);
    }

    window.VernonDeskQuickEntry = { render: render, FORMS: FORMS };
})();

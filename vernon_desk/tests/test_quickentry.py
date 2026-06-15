"""Integrity tests for the Vernon quick-entry desk Pages.

Bench-free (plain unittest, no frappe import): verifies the static surface —
each quick-entry Page has a valid standard Page record, its page JS registers
the matching slug, the shared assets exist and are wired into hooks.py in the
right order, the FORMS config is internally consistent, and the workspace
fixture exposes a shortcut to each page.

Runtime/field correctness against the live ERPNext doctypes is intentionally
out of scope here (frappe core is not on disk in CI) — it is covered by the
manual acceptance checklist in the implementation plan.

Covers: docs/superpowers/specs/2026-06-15-quick-entry-pages-design.md
"""

import json
import os
import re
import unittest

# tests/ lives at <app_package>/tests, so the package root is one level up.
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PAGE_DIR = os.path.join(APP_DIR, "vernon_desk", "page")
ENGINE_JS = os.path.join(APP_DIR, "public", "js", "vernon_desk_quickentry.js")
DATA_JS = os.path.join(APP_DIR, "public", "js", "vernon_desk_quickentry_data.js")
QE_CSS = os.path.join(APP_DIR, "public", "css", "vernon_desk_quickentry.css")

# dir_name -> (page slug, page title, render key)
PAGES = {
    "sales_quick_invoice": ("sales-quick-invoice", "Faktur Penjualan Cepat", "sales"),
    "purchase_quick_invoice": ("purchase-quick-invoice", "Faktur Pembelian Cepat", "purchase"),
    "stock_quick_entry": ("stock-quick-entry", "Input Stok Cepat", "stock"),
    "payment_quick_entry": ("payment-quick-entry", "Pembayaran Cepat", "payment"),
}

# Field types the engine knows how to render (mirror FIELDTYPES in the data JS).
FIELDTYPES = {"Link", "Date", "Float", "Currency", "Select", "Data"}
# The doctype each form must target.
FORM_DOCTYPES = {"Sales Invoice", "Purchase Invoice", "Stock Entry", "Payment Entry"}


def _read(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


class TestQuickEntryDataModel(unittest.TestCase):
    """Parse the FORMS config out of the data JS and check consistency."""

    @classmethod
    def setUpClass(cls):
        cls.js = _read(DATA_JS)

    def test_four_forms_declared(self):
        for key in ("sales", "purchase", "stock", "payment"):
            self.assertRegex(self.js, r"\b" + key + r"\s*:\s*\{")

    def test_every_form_targets_the_expected_doctype(self):
        doctypes = re.findall(r'doctype:\s*"([^"]*)"', self.js)
        self.assertEqual(set(doctypes), FORM_DOCTYPES, "form doctypes drifted from spec")

    def test_fieldtypes_are_defined_and_complete(self):
        # The FIELDTYPES freeze block defines the alias -> label map.
        freeze = re.search(r"FIELDTYPES\s*=\s*Object\.freeze\(\{([^}]*)\}\)", self.js)
        self.assertIsNotNone(freeze, "FIELDTYPES freeze block not found")
        body = freeze.group(1)
        alias_keys = set(re.findall(r"([A-Z_]+)\s*:", body))
        labels = set(re.findall(r'"([A-Za-z]+)"', body))
        # The freeze must define EXACTLY the supported field-type labels.
        self.assertEqual(labels, FIELDTYPES, "FIELDTYPES freeze drifted from the supported set")
        # Every T.<ALIAS> used by a field df must be a defined freeze key
        # (catches a typo like T.LIMK that would resolve to undefined).
        used = set(re.findall(r"fieldtype:\s*T\.([A-Z_]+)", self.js))
        self.assertTrue(used, "no fieldtypes parsed from field configs")
        self.assertTrue(used.issubset(alias_keys), "field uses undefined T.* alias: " + str(used - alias_keys))

    def test_reqd_select_defaults_are_valid_options(self):
        # Every Select field's default must be one of THAT field's own newline
        # options, else validate() would falsely flag a defaulted field as
        # missing. Bind per-field (a global option pool would false-pass when an
        # unrelated Link field happens to share the same option value).
        select_blocks = re.findall(r"\{[^{}]*fieldtype:\s*T\.SELECT[^{}]*\}", self.js)
        self.assertEqual(len(select_blocks), 3, "expected 3 Select fields (stock type, payment type, party type)")
        for block in select_blocks:
            opts = re.search(r'options:\s*"([^"]*)"', block)
            deft = re.search(r'default:\s*"([^"]*)"', block)
            self.assertIsNotNone(opts, "Select field without options: " + block)
            self.assertIsNotNone(deft, "Select field without default: " + block)
            options = opts.group(1).split("\\n")
            self.assertIn(deft.group(1), options, deft.group(1) + " not in its own options " + str(options))

    def test_data_exposes_window_global(self):
        self.assertIn("window.VernonDeskQuickEntryData", self.js)


class TestEngineSurface(unittest.TestCase):
    """The engine file exists and exposes the public API with no server logic."""

    @classmethod
    def setUpClass(cls):
        cls.js = _read(ENGINE_JS)

    def test_engine_exposes_window_global(self):
        self.assertIn("window.VernonDeskQuickEntry", self.js)
        self.assertRegex(self.js, r"render\s*:")

    def test_engine_inserts_via_client_api(self):
        # Business logic stays server-side: the engine only calls the generic
        # client insert/submit endpoints, never bespoke server methods.
        self.assertIn("frappe.client.insert", self.js)

    def test_engine_reads_data_layer(self):
        self.assertIn("window.VernonDeskQuickEntryData", self.js)


class TestPageRecords(unittest.TestCase):
    """Every quick-entry dir ships a valid standard Page + matching JS."""

    def test_page_json_is_valid(self):
        for dir_name, (slug, title, _key) in PAGES.items():
            path = os.path.join(PAGE_DIR, dir_name, dir_name + ".json")
            self.assertTrue(os.path.exists(path), "missing " + path)
            record = json.loads(_read(path))
            self.assertEqual(record["doctype"], "Page")
            self.assertEqual(record["name"], slug)
            self.assertEqual(record["page_name"], slug)
            self.assertEqual(record["title"], title)
            self.assertEqual(record["module"], "Vernon Desk")
            self.assertEqual(record["standard"], "Yes")

    def test_page_js_registers_slug_and_key(self):
        for dir_name, (slug, _title, key) in PAGES.items():
            path = os.path.join(PAGE_DIR, dir_name, dir_name + ".js")
            self.assertTrue(os.path.exists(path), "missing " + path)
            js = _read(path)
            self.assertIn('frappe.pages["' + slug + '"]', js)
            self.assertIn('"' + key + '"', js)


class TestSharedAssets(unittest.TestCase):
    """Engine/data/css exist and are wired into hooks.py in the right order."""

    def test_assets_present(self):
        for path in (ENGINE_JS, DATA_JS, QE_CSS):
            self.assertTrue(os.path.exists(path), path)

    def test_hooks_include_quickentry_assets(self):
        hooks = _read(os.path.join(APP_DIR, "hooks.py"))
        self.assertIn("css/vernon_desk_quickentry.css", hooks)
        self.assertIn("js/vernon_desk_quickentry_data.js", hooks)
        self.assertIn("js/vernon_desk_quickentry.js", hooks)

    def test_data_loads_before_engine(self):
        # The engine reads window.VernonDeskQuickEntryData, so the data bundle
        # must appear before the engine bundle in app_include_js.
        hooks = _read(os.path.join(APP_DIR, "hooks.py"))
        self.assertLess(
            hooks.index("js/vernon_desk_quickentry_data.js"),
            hooks.index('js/vernon_desk_quickentry.js"'),
            "data bundle must be listed before the engine bundle",
        )


class TestWorkspaceFixture(unittest.TestCase):
    """The workspace fixture exposes a Page shortcut to each quick-entry page."""

    def test_fixture_has_four_quickentry_shortcuts(self):
        path = os.path.join(APP_DIR, "fixtures", "workspace.json")
        self.assertTrue(os.path.exists(path), "missing " + path)
        records = json.loads(_read(path))
        shortcuts = []
        for ws in records:
            shortcuts.extend(ws.get("shortcuts", []))
        targets = {s.get("link_to") for s in shortcuts if s.get("type") == "Page"}
        for _dir, (slug, _title, _key) in PAGES.items():
            self.assertIn(slug, targets, "no workspace shortcut for " + slug)

    def test_content_shortcut_names_match_shortcut_labels(self):
        # A content 'shortcut' block references its shortcut by shortcut_name,
        # which must equal a shortcut row's label or it renders blank.
        path = os.path.join(APP_DIR, "fixtures", "workspace.json")
        records = json.loads(_read(path))
        for ws in records:
            labels = {s.get("label") for s in ws.get("shortcuts", [])}
            content = json.loads(ws.get("content", "[]"))
            names = {b["data"]["shortcut_name"] for b in content if b.get("type") == "shortcut"}
            self.assertTrue(names.issubset(labels), "content shortcut_name without a matching label: " + str(names - labels))


if __name__ == "__main__":
    unittest.main()

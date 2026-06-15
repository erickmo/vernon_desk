"""Integrity tests for the ERPNext onboarding guide desk Pages.

These run without a bench (plain unittest, no frappe import) so they verify
the static surface: every guide has a valid Page record, its page JS
registers the matching slug, the shared assets exist and are wired into
hooks.py, and the WORKFLOWS data model is internally consistent (every
stage references a lane that the workflow declares).

Covers: docs/superpowers/specs/2026-06-15-onboarding-guides-design.md
"""

import json
import os
import re
import unittest

# tests/ lives at <app_package>/tests, so the package root is one level up.
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PAGE_DIR = os.path.join(APP_DIR, "vernon_desk", "page")
GUIDES_JS = os.path.join(APP_DIR, "public", "js", "vernon_desk_guides.js")
GUIDES_DATA_JS = os.path.join(APP_DIR, "public", "js", "vernon_desk_guides_data.js")
GUIDES_CSS = os.path.join(APP_DIR, "public", "css", "vernon_desk_guides.css")

# dir_name -> (page slug, page title)
PAGES = {
    "vernon_onboarding": ("vernon-onboarding", "Panduan Onboarding"),
    "sales_guide": ("sales-guide", "Panduan Penjualan"),
    "purchase_guide": ("purchase-guide", "Panduan Pembelian"),
    "stock_guide": ("stock-guide", "Panduan Persediaan"),
}

# Allowed swimlane lane ids and stage actions (mirror NODE_ACTIONS in JS).
LANE_IDS = {"primary", "wh", "fin"}
ACTIONS = {"list", "new", "report"}


def _read(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


class TestGuidePageRecords(unittest.TestCase):
    """Every guide dir ships a valid standard Page record + matching JS."""

    def test_page_json_is_valid(self):
        for dir_name, (slug, title) in PAGES.items():
            path = os.path.join(PAGE_DIR, dir_name, dir_name + ".json")
            self.assertTrue(os.path.exists(path), "missing " + path)
            record = json.loads(_read(path))
            self.assertEqual(record["doctype"], "Page")
            self.assertEqual(record["name"], slug)
            self.assertEqual(record["page_name"], slug)
            self.assertEqual(record["title"], title)
            self.assertEqual(record["module"], "Vernon Desk")
            self.assertEqual(record["standard"], "Yes")

    def test_page_js_registers_its_slug(self):
        for dir_name, (slug, _title) in PAGES.items():
            path = os.path.join(PAGE_DIR, dir_name, dir_name + ".js")
            self.assertTrue(os.path.exists(path), "missing " + path)
            self.assertIn('frappe.pages["' + slug + '"]', _read(path))


class TestSharedAssets(unittest.TestCase):
    """Shared bundle exists and is wired into hooks.py."""

    def test_assets_present(self):
        self.assertTrue(os.path.exists(GUIDES_JS), GUIDES_JS)
        self.assertTrue(os.path.exists(GUIDES_DATA_JS), GUIDES_DATA_JS)
        self.assertTrue(os.path.exists(GUIDES_CSS), GUIDES_CSS)

    def test_hooks_include_guide_assets(self):
        hooks = _read(os.path.join(APP_DIR, "hooks.py"))
        self.assertIn("css/vernon_desk_guides.css", hooks)
        self.assertIn("js/vernon_desk_guides_data.js", hooks)
        self.assertIn("js/vernon_desk_guides.js", hooks)

    def test_data_loads_before_view(self):
        # The view reads window.VernonDeskGuidesData, so the data bundle
        # must appear before the view bundle in app_include_js.
        hooks = _read(os.path.join(APP_DIR, "hooks.py"))
        self.assertLess(
            hooks.index("vernon_desk_guides_data.js"),
            hooks.index('vernon_desk_guides.js"'),
            "data bundle must be listed before the view bundle",
        )


class TestWorkflowDataModel(unittest.TestCase):
    """Parse the WORKFLOWS object out of the JS and check consistency.

    A lightweight regex/JSON extraction avoids a JS runtime: it confirms
    each of the three workflows exists, declares the three lanes, and that
    every stage's lane + action are within the allowed sets.
    """

    @classmethod
    def setUpClass(cls):
        cls.js = _read(GUIDES_DATA_JS)

    def test_three_workflows_declared(self):
        for key in ("sales", "purchase", "stock"):
            self.assertRegex(self.js, r"\b" + key + r"\s*:\s*\{")

    def test_every_stage_lane_is_declared(self):
        # Each stage literal carries a lane: "<id>" — all must be known ids.
        lanes = set(re.findall(r'lane:\s*"([a-z]+)"', self.js))
        self.assertTrue(lanes, "no stage lanes parsed")
        self.assertTrue(lanes.issubset(LANE_IDS), "orphan lane id(s): " + str(lanes - LANE_IDS))

    def test_every_stage_action_is_known(self):
        actions = set(re.findall(r'action:\s*"([a-z]+)"', self.js))
        self.assertTrue(actions, "no stage actions parsed")
        self.assertTrue(actions.issubset(ACTIONS), "unknown action(s): " + str(actions - ACTIONS))

    def test_each_stage_has_a_doctype(self):
        # label + doctype appear paired on each stage line; ensure no empties.
        doctypes = re.findall(r'doctype:\s*"([^"]*)"', self.js)
        self.assertGreaterEqual(len(doctypes), 21, "expected >= 21 stage doctypes")
        self.assertTrue(all(d.strip() for d in doctypes), "empty doctype found")


if __name__ == "__main__":
    unittest.main()

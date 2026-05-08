import frappe
from frappe.tests.utils import FrappeTestCase

from vernon_desk.boot import inject_desk_settings

DOCTYPE = "Vernon Desk Settings"


class TestBoot(FrappeTestCase):
    def setUp(self):
        self._original_theme = frappe.db.get_value(DOCTYPE, DOCTYPE, "theme")

    def test_inject_desk_settings_puts_theme_in_bootinfo(self):
        frappe.db.set_value(DOCTYPE, DOCTYPE, "theme", "sunset_dusk")
        frappe.local.bootinfo = frappe._dict()
        inject_desk_settings()
        self.assertEqual(frappe.local.bootinfo.vernon_desk["theme"], "sunset_dusk")

    def test_inject_desk_settings_defaults_to_cosmic_ocean_when_empty(self):
        frappe.db.set_value(DOCTYPE, DOCTYPE, "theme", "")
        frappe.local.bootinfo = frappe._dict()
        inject_desk_settings()
        self.assertEqual(frappe.local.bootinfo.vernon_desk["theme"], "cosmic_ocean")

    def tearDown(self):
        frappe.db.set_value(DOCTYPE, DOCTYPE, "theme", self._original_theme or "cosmic_ocean")

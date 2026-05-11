import frappe


def inject_desk_settings(bootinfo):
    settings = frappe.get_single("Vernon Desk Settings")
    bootinfo.vernon_desk = {
        "theme": settings.theme or "cosmic_ocean"
    }

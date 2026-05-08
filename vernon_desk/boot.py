import frappe


def inject_desk_settings():
    settings = frappe.get_single("Vernon Desk Settings")
    frappe.local.bootinfo.vernon_desk = {
        "theme": settings.theme or "cosmic_ocean"
    }

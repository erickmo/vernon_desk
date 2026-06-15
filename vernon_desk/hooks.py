app_name = "vernon_desk"
app_title = "Vernon Desk"
app_publisher = "Vernon Corp"
app_description = "Custom Frappe desk layout — dual navbar, full-width content"
app_email = "dev@vernoncorp.com"
app_license = "mit"

boot_session = "vernon_desk.boot.inject_desk_settings"

app_include_css = [
    "/assets/vernon_desk/css/vernon_desk.css",
    "/assets/vernon_desk/css/vernon_desk_guides.css",
    "/assets/vernon_desk/css/vernon_desk_quickentry.css",
]
app_include_js = [
    "/assets/vernon_desk/js/vernon_desk.js",
    "/assets/vernon_desk/js/vernon_desk_guides_data.js",
    "/assets/vernon_desk/js/vernon_desk_guides.js",
    "/assets/vernon_desk/js/vernon_desk_quickentry_data.js",
    "/assets/vernon_desk/js/vernon_desk_quickentry.js",
]

fixtures = [
    {
        "doctype": "Workspace",
        "filters": [["module", "in", ["Vernon Desk"]]]
    }
]

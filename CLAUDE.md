# Vernon Desk — Project Context

## What This App Is

Frappe app that redesigns the default Frappe Desk UI to be more modern with better UI/UX.
It overrides/extends the default Frappe frontend via custom CSS and JS injected through hooks.

## Navigation Architecture

- **nav1** — Main navigation bar (top-level menu items / modules)
- **nav2** — Submenu of the active nav1 item (secondary navigation, contextual to selection)

## Stack

- **Backend**: Python / Frappe framework
- **Frontend**: Vanilla JS + CSS (injected via Frappe hooks — no build step)
- Entry points: `vernon_desk/public/js/vernon_desk.js` and `vernon_desk/public/css/vernon_desk.css`
- Settings DocType: `vernon_desk/vernon_desk/doctype/vernon_desk_settings/`

## Key Files

| File | Purpose |
|------|---------|
| `vernon_desk/hooks.py` | Registers JS/CSS assets and boot hooks |
| `vernon_desk/boot.py` | Injects data into Frappe boot (available as `frappe.boot`) |
| `vernon_desk/public/js/vernon_desk.js` | Main frontend JS — nav1/nav2 logic, DOM overrides |
| `vernon_desk/public/css/vernon_desk.css` | Main stylesheet — design tokens, layout overrides |

## Coding Rules

- Follow `frappe-coding-standard` skill
- JS must be vanilla (no bundler — Frappe serves assets directly)
- CSS uses custom properties (CSS variables) for all design tokens
- Never touch Frappe core files — override via DOM manipulation or CSS specificity
- nav1 and nav2 must be decoupled: nav2 state is always derived from nav1 active item

## Stack Skill

Load `~/.claude/skills/frappe-coding-standard/SKILL.md` for every session in this project.

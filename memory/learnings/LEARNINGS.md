# Learnings Log

Discoveries, patterns, and non-obvious solutions. Recurring patterns get promoted to CLAUDE.md.

---

### LRN-001: Tailscale cert files owned by root crash amux server silently
- **Logged:** 2026-04-01
- **Area:** infra
- **Priority:** high
- **Pattern-Key:** infra.tailscale_cert_permissions
- **Recurrence-Count:** 1
- **First-Seen:** 2026-04-01
- **Last-Seen:** 2026-04-01
- **Context:** `sudo tailscale cert` writes .crt and .key files as root:root with 0600 permissions. The amux server runs as the current user and silently fails to start when it cannot read the key file — no error message, just exits.
- **Resolution:** `sudo chown $(whoami):$(whoami) ~/.amux/tls/*` after generating certs.
- **See Also:** —
- **Status:** pending

---

### LRN-002: Android Chrome drops self-signed HTTPS connections silently
- **Logged:** 2026-04-01
- **Area:** infra
- **Priority:** high
- **Pattern-Key:** infra.android_selfsigned_certs
- **Recurrence-Count:** 1
- **First-Seen:** 2026-04-01
- **Last-Seen:** 2026-04-01
- **Context:** Modern Android Chrome does not show a "proceed anyway" warning for self-signed certificates on non-localhost addresses. It shows "site can't be reached" instead. Firefox Android has a known bug where the cert exception UI doesn't appear.
- **Resolution:** Use Tailscale HTTPS certs (real Let's Encrypt) instead of self-signed. No phone-side certificate installation needed.
- **See Also:** LRN-001
- **Status:** pending

---

### LRN-003: Escaped apostrophes in Python-embedded JS strings
- **Logged:** 2026-04-01
- **Area:** frontend
- **Priority:** critical
- **Pattern-Key:** frontend.python_embedded_js_escaping
- **Recurrence-Count:** 1
- **First-Seen:** 2026-04-01
- **Last-Seen:** 2026-04-01
- **Context:** In amux-server.py (Python byte string containing inline JS), `\\'s` produces a literal backslash + quote in the browser, terminating a single-quoted JS string. This broke ALL JavaScript on the dashboard — a single escaping error in one tool description made the entire UI non-interactive.
- **Resolution:** Avoid apostrophes in single-quoted JS strings embedded in Python, or reword to avoid possessives entirely.
- **See Also:** —
- **Status:** pending

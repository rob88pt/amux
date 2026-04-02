# amux - Session Handoff

**Date**: 2026-04-01 → 2026-04-02
**Location**: `/home/robert/Dev/amux`
**Session Goal**: Install amux, get the dashboard working, and set up remote phone access from Android.

---

## Chronological Narrative

### 1. Installation
- Installed amux to `~/.local/bin` using `AMUX_INSTALL_DIR` to avoid sudo
- Started server with `amux serve` — needed nohup or tmux for persistence since `os.execv` auto-restart kills background processes

### 2. Dashboard Bug Discovery
- Dashboard loaded but nothing was clickable — all tabs, buttons, menus were unresponsive
- Used Playwright (headless Chromium with `ignoreHTTPSErrors: true`) to screenshot and test
- Found two JS errors in console: `Unexpected identifier 's'` and `Quill is not defined`
- Traced to `amux-server.py:13470` — `\\'s` in a voice assistant tool description string
- Fixed by rewording to remove the apostrophe
- Also found walkthrough overlay blocks clicks on first load (by design, needs dismissal)

### 3. PR Submission
- Forked to `rob88pt/amux`, created branch `fix/js-syntax-error-voice-description`
- Submitted PR: mixpeek/amux#10
- Also pushed `amux-deploy` skill on branch `feat/amux-deploy-skill`

### 4. Tailscale Phone Access
- Installed Tailscale, authenticated, phone connected (`xiaomi-11t-pro` at `100.125.92.128`)
- Android Chrome showed "site can't be reached" for self-signed cert (no bypass option)
- Firefox Android also failed (known bug — no cert exception UI)
- Enabled HTTPS certs in Tailscale admin console (MagicDNS + HTTPS)
- Generated Let's Encrypt cert via `sudo tailscale cert`
- **Gotcha**: cert files owned by root — server silently crashed. Fixed with chown.
- Phone now accesses `https://legion.tail52b707.ts.net:8822` successfully

---

## Current Technical State

- **Server**: Running on port 8822 with Tailscale Let's Encrypt cert
- **Tailscale hostname**: `legion.tail52b707.ts.net`
- **Git**: main branch, fork remote `rob88pt/amux`, origin `mixpeek/amux`
- **Two active sessions**: `Test` (Opus, /home/robert/Dev/test) and `amux-helper` (Sonnet, /home/robert/Dev/amux)
- **Session logs**: Full output stored in `~/.amux/logs/Test.log` (8464 lines) and `~/.amux/logs/amux-helper.log` (1321 lines)

---

## Files Changed

### Created
| File | Purpose |
|------|---------|
| `.claude/skills/amux-deploy/SKILL.md` | Skill documenting install, Tailscale, phone access |
| `memory/` (all files) | Project memory system bootstrap |

### Modified
| File | What Changed |
|------|-------------|
| `amux-server.py:13470` | Fixed `\\'s` → removed apostrophe in JS string |

---

## Problems Faced & Solutions

| Problem | Solution |
|---------|----------|
| Dashboard completely non-interactive | JS syntax error in voice tool description; fixed escaping |
| Playwright can't connect (self-signed cert) | Used `ignoreHTTPSErrors: true` in browser context |
| `sudo tailscale cert` files unreadable by server | `chown` to current user |
| Android Chrome "site can't be reached" for self-signed | Tailscale HTTPS certs (real Let's Encrypt) |
| Server dies after `touch` restart with nohup | `os.execv` replaces process; use tmux or restart manually |

---

## Next Session Action Plan

1. **Investigate session log viewing** — the Logs tab and peek Logs toggle should show full conversation history from `~/.amux/logs/`
2. **Set up Anthropic API key** — the banner says "No Anthropic API key set" which limits Claude session features
3. **Cert renewal automation** — Tailscale certs expire in 90 days

---

## Quick Commands
```bash
cd /home/robert/Dev/amux

# Start server
nohup python3 amux-server.py > /tmp/amux-server.log 2>&1 &

# Check server
curl -sk https://localhost:8822 -o /dev/null -w "%{http_code}"

# Check cert
echo | openssl s_client -connect localhost:8822 2>/dev/null | grep -E "subject=|issuer="

# List sessions
amux ls

# Peek at session
amux peek Test 100

# Tailscale status
tailscale status

# Phone URL
# https://legion.tail52b707.ts.net:8822
```

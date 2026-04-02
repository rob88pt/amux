# Changelog

## [2026-04-01] - Initial Setup & JS Fix

### Fixed
- Critical JS syntax error at `amux-server.py:13470` — `\\'s` in a single-quoted JS string caused `Unexpected identifier 's'`, breaking all JavaScript on the dashboard (no tabs, no buttons, nothing worked)

### Added
- `.claude/skills/amux-deploy/SKILL.md` — skill documenting full install, Tailscale setup, phone access, and troubleshooting
- Tailscale HTTPS certificates in `~/.amux/tls/` for trusted phone access

### Decisions
- Used Tailscale HTTPS certs instead of mkcert or self-signed — modern Android Chrome silently drops connections to self-signed certs with no bypass option; Tailscale provides real Let's Encrypt certs trusted by all browsers
- Installed amux to `~/.local/bin` to avoid sudo requirement
- Forked repo to `rob88pt/amux` for contributing fixes upstream

### Problems & Solutions
- Dashboard completely non-interactive → JS syntax error in voice assistant tool description; fixed by removing the apostrophe from the string
- Walkthrough overlay blocking clicks on first load → overlay needs to be dismissed before tabs work
- Server silently crashing after cert setup → `sudo tailscale cert` writes key files as root; fixed with `chown`
- Android "site can't be reached" → self-signed certs don't work on modern Android; solved with Tailscale HTTPS certs

### Files Affected
- `amux-server.py` - fixed JS syntax error on line 13470
- `.claude/skills/amux-deploy/SKILL.md` - new skill file

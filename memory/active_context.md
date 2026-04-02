# Active Context

## Current Focus
Initial setup of amux on a Linux desktop (Linux Mint / Ubuntu). Server running locally and accessible remotely from Android phone via Tailscale.

## Recent Changes
- [2026-04-01] Fixed critical JS syntax error breaking all dashboard interactivity
- [2026-04-01] Installed and configured Tailscale with HTTPS certs for phone access
- [2026-04-01] Created `amux-deploy` skill documenting installation and phone setup
- [2026-04-01] Submitted fix as PR to upstream (mixpeek/amux#10)

## Next Steps
- [ ] Investigate full session conversation viewing (logs tab, scrollback)
- [ ] Set up cert renewal automation (Tailscale certs expire after 90 days)
- [ ] Configure Anthropic API key in amux settings for Claude session management

## Blockers / Open Questions
- Quill.js CDN sometimes fails to load in headless browsers (works fine in real Chrome)
- Notes tab throws `Cannot access '_notesCurrentNotes' before initialization` error

## Session Notes
- Server is at `https://legion.tail52b707.ts.net:8822` (Tailscale) or `https://localhost:8822` (local)
- Fork remote is `rob88pt/amux`, origin is `mixpeek/amux`
- Two sessions running: `Test` (Opus) and `amux-helper` (Sonnet)

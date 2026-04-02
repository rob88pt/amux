# Changelog Summary

## Current State
amux is installed and running locally on a Linux desktop. The web dashboard is accessible at `https://localhost:8822` and remotely from Android phone at `https://legion.tail52b707.ts.net:8822` via Tailscale. A critical JS bug that broke all dashboard interactivity has been fixed and submitted as PR to upstream.

## Major Milestones
- **[2026-04]** Initial setup, JS fix PR submitted (mixpeek/amux#10), Tailscale phone access working

## Key Decisions
- Tailscale HTTPS over self-signed certs for mobile access (Android compatibility)
- Fork-based contribution model (rob88pt/amux → mixpeek/amux)

## Recent Focus
- Getting amux installed, running, and accessible from phone
- Fixing dashboard-breaking JS syntax error
- Creating deployment skill for future reference

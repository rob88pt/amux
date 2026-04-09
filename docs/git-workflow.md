# Git Workflow

This repo is a fork of [mixpeek/amux](https://github.com/mixpeek/amux) with custom enhancements.

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | `https://github.com/rob88pt/amux.git` | Your fork — push changes here |
| `upstream` | `https://github.com/mixpeek/amux.git` | Original repo — pull updates from here |

## Pushing Your Changes

```bash
git add <files> && git commit -m "message" && git push origin main
```

## Pulling Upstream Updates

```bash
git fetch upstream && git merge upstream/main
```

## Viewing Upstream Changes Before Merging

```bash
git fetch upstream
git log upstream/main --oneline --not main
git diff --stat main upstream/main
```

## Likely Conflict Files

These files contain custom additions and will need attention during upstream merges:

| File | Customization |
|------|--------------|
| `amux` | `dispatch` command (register + start + send prompt in one shot) |

When merging upstream changes to `amux`, preserve the `cmd_dispatch` function and its entry in the `case` dispatch block and help text.

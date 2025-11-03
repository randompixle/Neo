# Solar Neo v0.7 — Hybrid Command Edition

Solar Neo is a friendly, hybrid CLI that lets you use **APT-style** flows on non‑APT distros.
It auto-detects backends (rpm-ostree, dnf5, flatpak) and falls back when needed.

## Quick Start
```bash
unzip Solar-Neo-v0.7-Final.zip -d Solar-Neo-v0.7
cd Solar-Neo-v0.7
./install.sh
solar sys
```

## Commands
- `solar search <name>`
- `solar install <name>`
- `solar remove <name>`
- `solar list`
- `solar self-update`
- `solar uninstall-self`
- `solar sys`  (diagnostics)

`sln` is a short alias of `solar`.

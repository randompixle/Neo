# Solar Neo — Changelog

## v0.6 — Project Solar
### Fixes
- Fixed infinite self-update loop (restart no longer re-runs `self-update`).
- Proper version detection via `version.txt` + Python package version.

### Improvements
- Self-update: Releases ➜ fallback to main.zip; SemVer-like compare supports `v` prefix.
- Smart installer: user-local first; if permission denied auto-escalate to sudo and install system-wide.
- Cleaner debug logs (`SOLAR_DEBUG=1`).
- Better rpm-ostree handling (skips ineffective `dnf` remove on ostree systems).
- Log rotation (keep last 5).

### Misc
- Branding consolidated to **Solar Neo**; repo: `randompixle/Solar-Neo`.

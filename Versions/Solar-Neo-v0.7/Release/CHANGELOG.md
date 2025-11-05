# Changelog — Solar Neo v0.7

### Added
- Dual commands: `solar` (main) and `sln` (alias)
- Pretty, colorized diagnostics with `--debug` for verbose tracing
- Safer self-update with loop protection

### Changed
- Merged v0.6 backends with v0.7 command layer
- Better fallback order: dnf5 → flatpak (rpm-ostree is listed in sys info)

### Fixed
- Infinite self-update loop in some archive layouts

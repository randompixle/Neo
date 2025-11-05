#!/usr/bin/env bash
set -euo pipefail
DEST_SHARE="$HOME/.local/share/solar-neo"
DEST_BIN="$HOME/.local/bin"
mkdir -p "$DEST_SHARE" "$DEST_BIN"

echo "Installing Solar Neo v0.7 — PROJECT: SOLAR"
rsync -a --delete solarneo "$DEST_SHARE/" 2>/dev/null || cp -r solarneo "$DEST_SHARE/"
install -m 0755 solar "$DEST_BIN/solar"
install -m 0755 sln "$DEST_BIN/sln"

echo "Solar Neo v0.7 installed to $DEST_BIN (CLI) and $DEST_SHARE (core)."
echo "Try: solar sys"

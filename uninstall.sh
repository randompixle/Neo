#!/usr/bin/env bash
set -e
rm -rf "$HOME/.local/share/neo" "$HOME/.local/state/neo" "$HOME/.config/neo"
rm -f "$HOME/.local/bin/neo" "$HOME/.local/bin/neo.sh"
hash -r 2>/dev/null || true
echo "neo removed."

#!/usr/bin/env bash
# Tiny shim that invokes the local python package
set -euo pipefail

HOME_DIR="${HOME:-$(getent passwd "$(id -u)" | cut -d: -f6)}"
PKG_DIR="$HOME_DIR/.local/share/neo/neo"

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1; then
  PY=python
else
  echo "neo: Python is required but was not found."
  exit 127
fi

exec "$PY" -m neo "$@"

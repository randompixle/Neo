#!/usr/bin/env bash
set -euo pipefail

PREFIX="${HOME}/.local"
BIN="${PREFIX}/bin"
SHARE="${PREFIX}/share/solarneo"

rm -f  "${BIN}/solar" "${BIN}/sln" || true
rm -rf "${SHARE}" || true

echo "Solar Neo removed."
echo "Run: hash -r"

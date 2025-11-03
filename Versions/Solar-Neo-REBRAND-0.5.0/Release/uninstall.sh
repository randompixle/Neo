#!/usr/bin/env bash
set -euo pipefail

BIN="${HOME}/.local/bin/solar"
SHARE="${HOME}/.local/share/solar-neo"

rm -f "${BIN}" || true
rm -rf "${SHARE}" || true

echo "solar-neo removed."
echo "Run 'hash -r' or open a new shell if the command still appears."

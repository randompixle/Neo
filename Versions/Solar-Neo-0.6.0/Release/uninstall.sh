#!/usr/bin/env bash
set -euo pipefail

USR_BIN="${HOME}/.local/bin/solar"
USR_SHARE="${HOME}/.local/share/solarneo"

SYS_BIN="/usr/local/bin/solar"
SYS_SHARE="/usr/local/share/solarneo"

ok=0
if [ -f "${USR_BIN}" ] || [ -d "${USR_SHARE}" ]; then
  rm -f "${USR_BIN}" || true
  rm -rf "${USR_SHARE}" || true
  ok=1
fi

if [ -f "${SYS_BIN}" ] || [ -d "${SYS_SHARE}" ]; then
  sudo rm -f "${SYS_BIN}" || true
  sudo rm -rf "${SYS_SHARE}" || true
  ok=1
fi

echo "✔ Solar Neo removed from your system"
echo "⚠ Restart your terminal to refresh PATH"
exit 0

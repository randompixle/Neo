#!/usr/bin/env bash
set -euo pipefail

VER="$(cat ./version.txt 2>/dev/null || echo 'v0.6')"
USR_PREFIX="${HOME}/.local"
USR_BIN="${USR_PREFIX}/bin"
USR_SHARE="${HOME}/.local/share/solarneo"

SYS_PREFIX="/usr/local"
SYS_BIN="${SYS_PREFIX}/bin"
SYS_SHARE="${SYS_PREFIX}/share/solarneo"

install_to_prefix () {
  local BIN_DIR="$1"
  local SHARE_DIR="$2"

  mkdir -p "${BIN_DIR}"
  mkdir -p "${SHARE_DIR}"

  rsync -a ./solarneo/ "${SHARE_DIR}/solarneo/"
  install -m 0755 ./solar "${BIN_DIR}/solar"
  install -m 0644 ./CHANGELOG.md "${SHARE_DIR}/CHANGELOG.md" || true
  install -m 0644 ./README.md "${SHARE_DIR}/README.md" || true
  echo "${VER}" > "${SHARE_DIR}/version.txt"
}

echo "Installing Solar Neo ${VER} — PROJECT: SOLAR"

# Try user-local first
if install_to_prefix "${USR_BIN}" "${USR_SHARE}" 2>/dev/null; then
  echo "✅ Solar Neo installed — ${VER}"
  echo "PROJECT: SOLAR ☀"
  echo "Try: solar sys"
  exit 0
fi

# If permissions blocked, auto escalate
echo "⚠ Local install failed, attempting system-wide via sudo…"
if sudo bash -c "$(declare -f install_to_prefix); install_to_prefix '${SYS_BIN}' '${SYS_SHARE}'"; then
  echo "✅ Solar Neo installed — ${VER} (system-wide)"
  echo "PROJECT: SOLAR ☀"
  echo "Try: solar sys"
  exit 0
fi

echo "✖ Installation failed" >&2
exit 1

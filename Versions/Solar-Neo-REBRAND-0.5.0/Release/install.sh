#!/usr/bin/env bash
set -euo pipefail

PREFIX="${HOME}/.local"
BIN_DIR="${PREFIX}/bin"
SHARE_DIR="${HOME}/.local/share/solar-neo"

echo "Installing Solar Neo v0.5.0 — PROJECT: SOLAR"

mkdir -p "${BIN_DIR}"
mkdir -p "${SHARE_DIR}"

# Copy package
rsync -a ./solarneo/ "${SHARE_DIR}/solarneo/"
# Copy version + docs
install -m 0644 version.txt "${SHARE_DIR}/version.txt" || true
install -m 0644 CHANGELOG.md "${SHARE_DIR}/CHANGELOG.md" || true
install -m 0644 README.md "${SHARE_DIR}/README.md" || true

# Install wrapper
install -m 0755 ./bin/solar "${BIN_DIR}/solar"

echo "✅ Installed to ${SHARE_DIR}"
echo "✅ CLI available: ${BIN_DIR}/solar"
echo "🎉 Try: solar sys"

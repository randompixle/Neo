#!/usr/bin/env bash
set -e

echo "Installing Neo v0.4 — Project: Eclipse…"

INSTALL_BASE="$HOME/.local/share/neo"
BIN_DIR="$HOME/.local/bin"

mkdir -p "$INSTALL_BASE"
mkdir -p "$BIN_DIR"

# Copy package
rsync -a --delete neo "$INSTALL_BASE"/

# CLI launcher: run as module to fix relative imports
cat > "$BIN_DIR/neo" <<'EOF'
#!/usr/bin/env bash
exec python3 -m neo "$@"
EOF
chmod +x "$BIN_DIR/neo"

# Backwards-compat symlink
ln -sf "$BIN_DIR/neo" "$BIN_DIR/neo.sh" 2>/dev/null || true

echo "✅ Neo installed to $INSTALL_BASE"
echo "✅ CLI wrapper installed to $BIN_DIR/neo"

case ":$PATH:" in
  *":$BIN_DIR:"*) hash -r 2>/dev/null || true ;;
  *) echo "⚠ $BIN_DIR is not in PATH. Add: export PATH="$HOME/.local/bin:$PATH"" ;;
esac

echo "🎉 Installation complete! Run: neo sys-check"

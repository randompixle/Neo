# Solar Neo — v0.6 (Project: Solar)

**CLI:** `solar`

## Quick Install
```bash
unzip Solar-Neo-v0.6.zip
cd Solar-Neo-0.6
bash ./install.sh
hash -r
solar sys
```

## Commands
```bash
solar sys
solar list
solar search vlc
solar install org.videolan.VLC
solar remove org.videolan.VLC
solar self-update           # checks GitHub Releases first
solar self-update --force   # reinstall / downgrade even if older
solar uninstall-self
```

## Notes
- On rpm-ostree systems (Bazzite/Silverblue/etc), Solar prefers Flatpak for apps.
- Self-update pulls from `randompixle/Solar-Neo` Releases; falls back to main.zip if no asset.
- Logs rotate under `~/.local/share/solarneo/logs/`.

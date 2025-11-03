# Solar Neo

**CLI:** `solar`

## Quick Install
```bash
LATEST_URL=$(python3 - <<'PY'
import json
import urllib.request

INDEX_URL = "https://randompixle.github.io/Solar-Neo/Versions/Version_Index.json"

def version_key(raw):
    parts = []
    for piece in (raw or "0").split('.'):
        try:
            parts.append(int(piece))
        except ValueError:
            parts.append(piece)
    return parts

with urllib.request.urlopen(INDEX_URL) as response:
    data = json.load(response)

versions = [entry for entry in data.get("versions", []) if entry.get("files")]
if not versions:
    raise SystemExit("No releases found in Version_Index.json")

versions.sort(key=lambda entry: version_key(entry.get("version")), reverse=True)
latest = versions[0]

release_file = None
for candidate in latest.get("files", []):
    if candidate.get("name", "").lower() == "release.zip":
        release_file = candidate.get("path")
        break
if release_file is None:
    release_file = latest["files"][0]["path"]

print(f"https://randompixle.github.io/Solar-Neo/Versions/{release_file}")
PY
)

curl -L "$LATEST_URL" -o solar-neo.zip
unzip -o solar-neo.zip -d Solar-Neo
cd Solar-Neo/Release
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

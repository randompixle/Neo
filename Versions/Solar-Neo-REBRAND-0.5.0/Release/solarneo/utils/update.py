
import os, json, tempfile, zipfile, shutil
from urllib.request import urlopen
from .pretty import info, ok, warn, err
from .. import __version__

REPO = "randompixle/Solar-Neo"
API_LATEST = f"https://api.github.com/repos/{REPO}/releases/latest"
SRC_ZIP = f"https://github.com/{REPO}/archive/refs/heads/main.zip"

def self_update():
    # Try GitHub Releases first
    try:
        info("Checking GitHub releases…")
        with urlopen(API_LATEST) as r:
            data = json.load(r)
        tag = (data.get("tag_name") or "").lstrip("v")
        assets = data.get("assets", [])
        zip_url = None
        for a in assets:
            name = a.get("name","")
            if name.endswith(".zip"):
                zip_url = a.get("browser_download_url")
                break
        if tag and zip_url:
            return _download_and_install(zip_url, f"release v{tag}")
    except Exception as e:
        warn(f"Release check failed: {e}")

    # Fallback to source ZIP
    warn("Falling back to main branch ZIP…")
    return _download_and_install(SRC_ZIP, "source zip")

def _download_and_install(url, label):
    tmp = tempfile.mkdtemp(prefix="solarneo-")
    try:
        zpath = os.path.join(tmp, "pkg.zip")
        info(f"Downloading {label}…")
        with urlopen(url) as r, open(zpath, "wb") as f:
            shutil.copyfileobj(r, f)
        info("Extracting…")
        with zipfile.ZipFile(zpath) as z:
            z.extractall(tmp)
        # Find install.sh somewhere inside
        installer = None
        for root, dirs, files in os.walk(tmp):
            if "install.sh" in files:
                installer = os.path.join(root, "install.sh")
                break
        if not installer:
            err("install.sh not found in archive.")
            return 1
        os.chmod(installer, 0o755)
        info("Running installer…")
        return os.system(f"bash '{installer}'")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

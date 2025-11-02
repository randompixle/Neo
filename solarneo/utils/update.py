import os, json, tempfile, zipfile, shutil, subprocess, sys
from urllib.request import urlopen
from .pretty import info, ok, warn, err
from .semver import cmp as semver_cmp, parse as semver_parse
from .logs import rotate as log_rotate, stamp as log_stamp
from .. import __version__

REPO = "randompixle/Solar-Neo"
API_LATEST = f"https://api.github.com/repos/{REPO}/releases/latest"
SRC_ZIP = f"https://github.com/{REPO}/archive/refs/heads/main.zip"

def _read_installed_version():
    for base in (os.path.expanduser("~/.local/share/solarneo"),
                 "/usr/local/share/solarneo"):
        v = os.path.join(base, "version.txt")
        if os.path.isfile(v):
            try:
                with open(v, "r", encoding="utf-8") as f:
                    return f.read().strip()
            except Exception:
                pass
    return __version__

def _restart_clean():
    # Restart Solar without original args to avoid re-triggering self-update
    try:
        os.execvpe("solar", ["solar"], os.environ.copy())
    except Exception:
        pass

def _download_and_install(url, label):
    tmp = tempfile.mkdtemp(prefix="solarneo-")
    try:
        zpath = os.path.join(tmp, "pkg.zip")
        info(f"Downloading update from {label}…")
        log_stamp("INFO", f"Downloading: {url}")
        with urlopen(url) as r, open(zpath, "wb") as f:
            shutil.copyfileobj(r, f)
        info("Extracting update package…")
        with zipfile.ZipFile(zpath) as z:
            z.extractall(tmp)
        installer = None
        for root, _, files in os.walk(tmp):
            if "install.sh" in files:
                installer = os.path.join(root, "install.sh"); break
        if not installer:
            err("install.sh not found in update package.")
            log_stamp("ERROR", "install.sh missing in archive")
            return 1

        os.chmod(installer, 0o755)

        info("Uninstalling current version…")
        log_stamp("DEBUG", "Running: solar uninstall-self")
        subprocess.call(["solar", "uninstall-self"])

        info("Running installer…")
        log_stamp("DEBUG", f"Installer: {installer}")
        result = subprocess.call(["bash", installer])
        log_stamp("INFO", f"Installer exit code: {result}")
        if result == 0:
            ok("Solar Neo updated successfully")
            log_stamp("INFO", "Update successful; restarting clean")
            _restart_clean()
        else:
            err("Installer reported failure")
        return result
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

def self_update(force=False):
    log_rotate(max_files=5)
    log_stamp("INFO", "==== self-update start ====")

    local_ver = _read_installed_version()
    info(f"Current version: {local_ver}")
    log_stamp("DEBUG", f"Local version: {local_ver}")

    remote_ver = None
    zip_url = None

    # Prefer GitHub Releases
    try:
        info("Checking GitHub releases…")
        with urlopen(API_LATEST) as r:
            data = json.load(r)
        tag = (data.get("tag_name") or "").strip()
        assets = data.get("assets", [])
        # Look for an asset that looks like our zip (case-insensitive)
        for a in assets:
            name = a.get("name","").lower()
            if name.endswith(".zip") and "solar-neo" in name:
                zip_url = a.get("browser_download_url"); break
        if tag:
            remote_ver = tag
            log_stamp("DEBUG", f"Remote version tag: {remote_ver}")
    except Exception as e:
        warn(f"Release check failed: {e}")
        log_stamp("WARN", f"Release check failed: {e}")

    # Compare versions if we have a remote tag
    if remote_ver and not force:
        if semver_parse(remote_ver) and semver_parse(local_ver):
            c = semver_cmp(local_ver, remote_ver)
            if c is not None:
                if c >= 0:
                    ok("Already up to date")
                    log_stamp("INFO", "Up-to-date; aborting")
                    return 0
                else:
                    info(f"Update available: {local_ver} → {remote_ver}")
        else:
            warn("Non-standard version format; proceeding with update")

    if remote_ver and force:
        warn("Force mode enabled — allowing downgrade/reinstall")
        log_stamp("WARN", "Force mode enabled")

    # Use release asset if possible; else fallback to main.zip
    if zip_url:
        rc = _download_and_install(zip_url, f"release {remote_ver}")
        log_stamp("INFO", f"release installer returned: {rc}")
        return rc
    else:
        warn("No release ZIP found — falling back to main branch archive")
        rc = _download_and_install(SRC_ZIP, "source (main)")
        log_stamp("INFO", f"source installer returned: {rc}")
        return rc

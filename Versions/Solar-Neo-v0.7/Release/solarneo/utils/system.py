import os, json, time, shutil, tempfile, zipfile
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from .. import API_BASE, __version__, GITHUB_OWNER, GITHUB_REPO, asset_name

# Paths (per-user)
INSTALL_DIR = os.path.expanduser("~/.local/share/solarneo")
PKG_DIR     = os.path.join(INSTALL_DIR, "solarneo")
BACKUP_DIR  = os.path.join(INSTALL_DIR, ".backup")
CFG_DIR     = os.path.expanduser("~/.config/solarneo")
CACHE_DIR   = os.path.expanduser("~/.cache/solarneo")

UA = {"User-Agent": f"solarneo/{__version__}"}

def ensure_dirs():
    for d in (INSTALL_DIR, PKG_DIR, BACKUP_DIR, CFG_DIR, CACHE_DIR):
        os.makedirs(d, exist_ok=True)

# ========== Solar Neo Install Backend (restored v0.6 logic + upgrades) ==========

import shutil, subprocess, time, sys
from urllib.request import urlopen

def have(bin_name): return shutil.which(bin_name) is not None

def run_cmd(args):
    try: return subprocess.run(args).returncode
    except: return 1

def capture_cmd(args):
    try:
        out = subprocess.check_output(args, stderr=subprocess.STDOUT)
        return 0, out.decode("utf-8", "replace")
    except subprocess.CalledProcessError as e:
        return e.returncode, e.output.decode("utf-8", "replace")
    except Exception as e:
        return 1, str(e)

def detect_backends():
    backs = []
    if have("dnf5"): backs.append("dnf")
    if have("flatpak"): backs.append("flatpak")
    return backs

def progress_bar(current, total, start_time):
    percent = (current / total) * 100
    elapsed = time.time() - start_time
    speed = current / (elapsed+0.1)
    eta = (total - current) / (speed+0.1)
    bar_len = 20
    filled = int(bar_len * percent/100)
    bar = "█" * filled + "░" * (bar_len-filled)
    sys.stdout.write(f"\r[{bar}] {percent:4.1f}% | {speed/1e6:5.1f} MB/s | eta {eta:4.1f}s ")
    sys.stdout.flush()

def flatpak_install(id):
    print("⮞ Installing via flatpak…")
    args = ["flatpak","install","-y","flathub",id] if "." not in id else ["flatpak","install","-y",id]
    return run_cmd(["sudo"]+args)

def flatpak_remove(id):
    print("⮞ Removing via flatpak…")
    if "." not in id: return 1
    return run_cmd(["sudo","flatpak","uninstall","-y",id])

def dnf_install(name):
    print("⮞ Installing via dnf…")
    return run_cmd(["sudo","dnf5","install","-y",name])

def dnf_remove(name):
    print("⮞ Removing via dnf…")
    return run_cmd(["sudo","dnf5","remove","-y",name])

def install_pkg(name):
    print(f"⮞ Resolving {name}…")
    backs = detect_backends()
    if not backs: return False,"No backend available"

    if have("dnf5"):
        rc = dnf_install(name)
        return (rc == 0), "dnf install failed" if rc else "ok"

    if have("flatpak"):
        rc = flatpak_install(name)
        return (rc == 0), "flatpak install failed" if rc else "ok"

    return False,"unknown backend fail"

def remove_pkg(name):
    backs = detect_backends()
    if not backs: return False,"No backend available"

    if have("dnf5"):
        rc = dnf_remove(name)
        return (rc == 0), "dnf remove failed" if rc else "ok"

    if have("flatpak"):
        rc = flatpak_remove(name)
        return (rc == 0), "flatpak remove failed" if rc else "ok"

    return False,"unknown backend fail"

def search_pkgs(query):
    shown = False
    if have("dnf5"):
        code,out = capture_cmd(["dnf5","search",query])
        if code == 0 and out.strip():
            print(out); shown = True
    if have("flatpak"):
        code,out = capture_cmd(["flatpak","search",query])
        if code == 0 and out.strip():
            print(out); shown = True
    return shown


# ---------- http helpers ----------
def http_json(url, data=None, headers=None, timeout=25):
    hdrs = {}
    hdrs.update(UA)
    if headers: hdrs.update(headers)
    req = Request(url, data=data, headers=hdrs)
    with urlopen(req, timeout=timeout) as r:
        b = r.read()
    try:
        return json.loads(b.decode("utf-8"))
    except Exception:
        return None

def api_get(params):
    return http_json(f"{API_BASE}?{urlencode(params)}")

def api_post(params, obj):
    data = json.dumps(obj).encode("utf-8")
    return http_json(f"{API_BASE}?{urlencode(params)}",
                     data=data, headers={"Content-Type":"application/json"})

# ---------- notes ----------
def get_notes(app):
    # API auto-creates on first access
    j = api_get({"cmd":"notes", "app":app})
    if not j: return {"community":[], "developer":[]}
    return {"community": j.get("community",[]) or [],
            "developer": j.get("developer",[]) or []}

def add_note(app, text):
    r = api_post({"cmd":"note_add"}, {"app":app, "text":text})
    return bool(r and r.get("ok"))

def add_dev_note(app, text, token):
    r = api_post({"cmd":"note_add_dev"}, {"app":app, "text":text, "token":token})
    return bool(r and r.get("ok"))

# ---------- version / update ----------
def latest_version():
    j = api_get({"cmd":"version"})
    if not j or "latest_version" not in j:
        return None
    return j["latest_version"]

def _http_get(url):
    req = Request(url, headers=UA)
    with urlopen(req, timeout=60) as r:
        return r.read()

def _save_bytes(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f: f.write(data)

def _unzip_to(src_zip, dest_dir):
    with zipfile.ZipFile(src_zip, "r") as z:
        z.extractall(dest_dir)

def _backup_current():
    slot = os.path.join(BACKUP_DIR, time.strftime("%Y%m%d-%H%M%S"))
    os.makedirs(slot, exist_ok=True)
    if os.path.isdir(PKG_DIR):
        shutil.copytree(PKG_DIR, os.path.join(slot, "solarneo"))
    return slot

def _replace_from(unpacked_root):
    """
    Copy unpacked_root/solarneo/* to PKG_DIR
    Handles zips where root contains either `solarneo/` or just the files.
    """
    # Find folder containing 'solarneo'
    src_root = unpacked_root
    for root, dirs, files in os.walk(unpacked_root):
        if "solarneo" in dirs:
            src_root = root
            break

    src = os.path.join(src_root, "solarneo")
    if not os.path.isdir(src):
        # fallback: maybe the root itself is the package
        src = unpacked_root

    if os.path.exists(PKG_DIR):
        shutil.rmtree(PKG_DIR)
    shutil.copytree(src, PKG_DIR)

def update_to(tag):
    """
    Download client-only release zip and install.
    Expected asset name: Solar-Neo_<tag>.zip
    """
    asset = asset_name(tag)      # e.g. Solar-Neo_v0.7.zip
    url   = f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases/download/{tag}/{asset}"

    with tempfile.TemporaryDirectory() as td:
        zpath = os.path.join(td, "client.zip")
        try:
            data = _http_get(url)
        except Exception as e:
            return False, f"download failed: {e}"
        _save_bytes(zpath, data)

        unpack = os.path.join(td, "unpack")
        os.makedirs(unpack, exist_ok=True)
        try:
            _unzip_to(zpath, unpack)
        except Exception as e:
            return False, f"unzip failed: {e}"

        _backup_current()
        try:
            _replace_from(unpack)
        except Exception as e:
            return False, f"install failed: {e}"

    return True, "ok"

def installed_version():
    # VS file distributed with the client; if missing, fall back to package version
    vfile = os.path.join(PKG_DIR, "..", "version.txt")
    if os.path.isfile(vfile):
        try:
            return open(vfile, "r", encoding="utf-8").read().strip()
        except Exception:
            pass
    return __version__

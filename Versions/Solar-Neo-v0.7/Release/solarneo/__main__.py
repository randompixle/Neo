import argparse, os, sys, shutil, tempfile, json, zipfile, subprocess
from urllib.request import urlopen

SELF_NAMES = {"solar", "solar-neo", "solarneo", "sln"}

from . import __version__, __codename__, __product__
from .utils.system import sys_check
from .utils.run import have, run, capture
from .utils.colors import info, ok, warn, err, _c

USER = os.environ.get('USER') or os.path.basename(os.path.expanduser('~'))

REPO = "randompixle/Solar-Neo"
API_LATEST = f"https://api.github.com/repos/{REPO}/releases/latest"
SRC_ZIP   = f"https://github.com/{REPO}/archive/refs/heads/main.zip"


# ✅ CLI Commands
def _flatpak_find(name, debug):
    code, out = capture(["flatpak", "search", name], debug=debug)
    if code != 0:
        return [], []

    apps = []
    plugins = []

    for line in out.splitlines():
        if "app/" in line:
            apps.append(line.split()[0])
        elif "runtime/com.obsproject" in line.lower():
            plugins.append(line.split()[0])

    return apps, plugins

def cmd_list(a):
    info("Installed packages (by backend):")
    if have("dnf5"):
        print("--- dnf5 ---")
        run(["dnf5","list","installed"], debug=a.debug)
    if have("flatpak"):
        print("--- flatpak ---")
        run(["flatpak","list"], debug=a.debug)
    return 0

def cmd_search(a):
    q = a.query; shown = False
    if have("dnf5"):
        code, out = capture(["dnf5","search",q], debug=a.debug)
        if code == 0: print(out); shown=True
    if have("flatpak"):
        code, out = capture(["flatpak","search",q], debug=a.debug)
        if code == 0: print(out); shown=True
    if not shown: warn("No results or backend unavailable.")
    return 0

def cmd_install(a):
    name = a.name
    debug = a.debug
    immutable = _immutable_system()

    # ✅ Auto-OBS logic + immutable preference
    if have("flatpak"):
        apps, plugins = _flatpak_find(name, debug)

        if apps:
            app_id = apps[0]

            info(f"Auto-select → {_c('33')}{app_id}{_c('0')} ✅")
            run(["flatpak", "install", "-y", app_id], debug=debug)
            ok("App install complete ✅")

            if plugins:
                print(f"\nFound {len(plugins)} OBS plugins:")
                for i,p in enumerate(plugins,1):
                    print(f"  {i}. {p}")

                yn = input("Install all OBS plugins? (Y/n): ").strip().lower()
                if yn in ("", "y", "yes"):
                    run(["flatpak","install","-y"] + plugins, debug=debug)
                    ok("Plugins installed ✅")

            return 0

    # ✅ If not OBS or no flatpak match → try `dnf5`
    if have("dnf5") and not immutable:
        rc = run(["dnf5","install","-y",name], debug=debug)
        if rc != 0:
            warn("dnf failed — trying sudo…")
            rc = run(["dnf5","install","-y",name], debug=debug, use_sudo=True)
        if rc == 0:
            ok("install complete ✅")
            return 0

    # ✅ Fallback: flatpak generic install
    if have("flatpak"):
        repo = ["flathub"] if "." not in name else []
        run(["flatpak","install","-y"] + repo + [name], debug=debug)
        ok("install complete ✅")
        return 0

    err("Package not found in any backend ❌")
    return 1

SELF_NAMES = {"solar", "solar-neo", "solarneo", "sln"}

def cmd_remove(a):
    name = a.name.lower()
    debug = a.debug

    # ✅ Self-removal
    if name in SELF_NAMES:
        warn("Uninstalling Solar Neo from system…")
        return cmd_uninstall_self(a)

    removed = False

    # ✅ Flatpak plugin purge first (OBS case)
    if have("flatpak"):
        apps, plugins = _flatpak_find(name, debug)

        if plugins:
            warn("Removing attached OBS plugins…")
            for p in plugins:
                run(["flatpak","uninstall","-y",p], debug=debug)

        # Try uninstall app
        rc = run(["flatpak","uninstall","-y",name], debug=debug)
        if rc == 0:
            removed = True

    # ✅ Fallback to dnf5 if not immutable
    if have("dnf5") and not _immutable_system():
        rc = run(["sudo", "dnf5", "remove", "-y", name], debug=debug)
        if rc == 0:
            removed = True

    if removed:
        ok("remove complete ✅")
        return 0

    err("Removal failed — system may be immutable or package not backend-managed ❌")
    return 1

    # ❌ Nothing worked
    err("Failed to remove package! System may be immutable or app not managed by backend.")
    return 1

def _immutable_system():
    # Detect bootc / Bazzite / Steam Deck readonly mode
    return (
        os.path.exists("/run/bootc") or
        "bazzite" in os.uname().release.lower() or
        os.path.exists("/run/ostree-booted")
    )

# ✅ Self-update Logic
def _extract_zip(path, dest):
    with zipfile.ZipFile(path) as z:
        z.extractall(dest)

def _local_version():
    return __version__

def cmd_self_update(a):
    if os.environ.get("SOLAR_UPDATING") == "1":
        warn("Update already running; aborting loop.")
        return 1
    os.environ["SOLAR_UPDATING"] = "1"

    info("Checking GitHub releases…")
    tag = None; zip_url = None
    try:
        with urlopen(API_LATEST) as r:
            data = json.load(r)
        tag = (data.get("tag_name") or "").lstrip("v")
        for ass in data.get("assets", []):
            if ass.get("name","").lower().endswith(".zip"):
                zip_url = ass.get("browser_download_url")
                break
    except Exception as e:
        warn(f"Release check failed: {e}")

    if not zip_url:
        warn("No release ZIP — falling back to main branch archive")
        zip_url = SRC_ZIP
        tag = tag or f"{_local_version()}-src"

    if tag <= _local_version():
        ok(f"Already up-to-date (v{_local_version()})")
        return 0

    tmp = tempfile.mkdtemp(prefix="solarupd-")
    try:
        zpath = os.path.join(tmp,"pkg.zip")
        info("Downloading update…")
        with urlopen(zip_url) as r, open(zpath,"wb") as f:
            shutil.copyfileobj(r,f)

        info("Extracting…")
        _extract_zip(zpath,tmp)

        installer = None
        for root,_,files in os.walk(tmp):
            if "install.sh" in files:
                installer = os.path.join(root,"install.sh")
                break
        if not installer:
            err("install.sh missing from package")
            return 1

        os.chmod(installer,0o755)

        info("Uninstalling current version…")
        subprocess.call([sys.executable,"-m","solarneo","uninstall-self"])

        info("Running installer…")
        rc = subprocess.call(["bash",installer])
        if rc != 0:
            err("Installer failed")
            return 1
        ok(f"Updated to v{tag}")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ✅ Uninstallation
def cmd_uninstall_self(a):
    base = os.path.expanduser("~/.local")
    binp = os.path.join(base, "bin")
    share = os.path.join(base, "share", "solarneo")

    info("Requesting sudo for uninstall...")
    sudo = ["sudo"] if os.geteuid() != 0 else []

    # remove binaries
    for exe in ("solar", "sln"):
        path = os.path.join(binp, exe)
        if os.path.exists(path):
            run(sudo + ["rm", "-f", path], debug=a.debug)

    # remove program data
    if os.path.exists(share):
        run(sudo + ["rm", "-rf", share], debug=a.debug)

    ok("✅ Solar Neo removed from system.")
    warn("Run: hash -r (to refresh PATH)")
    return 0


# ✅ CLI Entry
def main(argv=None):
    ap = argparse.ArgumentParser(prog="solar")
    ap.add_argument("--debug", action="store_true", help="verbose debug logs")
    ap.add_argument("-v","--version", action="store_true", help="print version and exit")
    sub = ap.add_subparsers(dest="cmd")

    sub.add_parser("sys")
    sub.add_parser("list")
    p = sub.add_parser("search");  p.add_argument("query")
    p = sub.add_parser("install"); p.add_argument("name")
    p = sub.add_parser("remove");  p.add_argument("name")
    sub.add_parser("self-update")
    sub.add_parser("uninstall-self")

    a = ap.parse_args(argv)

    # ✅ Colored banner
    if a.version:
        print(f"{_c('35;1')}{__product__}{_c('0')} {_c('36')}v{__version__}{_c('0')} — {_c('33')}{__codename__}{_c('0')}")
        return 0

    if a.cmd is None:
        print(f"{_c('35;1')}{__product__}{_c('0')} — {_c('36')}v{__version__}{_c('0')}")
        print(f"PROJECT: {_c('33')}{__codename__}{_c('0')}")
        print(f"by {_c('32')}{USER}{_c('0')}")
        print(f"{_c('34')}Try: {_c('1')}solar sys{_c('0')}")
        return 0

    if a.cmd=="sys":         return sys_check(debug=a.debug)
    if a.cmd=="list":        return cmd_list(a)
    if a.cmd=="search":      return cmd_search(a)
    if a.cmd=="install":     return cmd_install(a)
    if a.cmd=="remove":      return cmd_remove(a)
    if a.cmd=="self-update": return cmd_self_update(a)
    if a.cmd=="uninstall-self": return cmd_uninstall_self(a)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

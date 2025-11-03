import argparse, os, shutil, sys, getpass
from . import __version__, __codename__, __product__
from .utils.pretty import header, info, ok, warn, err
from .utils.run import run, capture, have
from .utils.sys import sys_check
from .utils.update import self_update

USER = os.environ.get("USER") or getpass.getuser()

def dbg(msg):
    if os.environ.get("SOLAR_DEBUG") == "1":
        print(f"[DEBUG] {msg}")

def detect_backends():
    backs = []
    if have("rpm-ostree"): backs.append("rpm-ostree")
    if have("dnf5"): backs.append("dnf")
    if have("pacman"): backs.append("pacman")
    if have("apt"): backs.append("apt")
    if have("flatpak"): backs.append("flatpak")
    dbg("Detected backends: " + (", ".join(backs) if backs else "NONE"))
    return backs

def auto_sudo(cmd):
    dbg("Run: " + " ".join(cmd))
    code = run(cmd)
    if code != 0:
        warn("Command failed; retrying with sudo…")
        code = run(["sudo"] + cmd)
    return code

def cmd_sys(_):
    detect_backends()
    sys_check(USER, __version__, __codename__)
    return 0

def cmd_list(_):
    detect_backends()
    info("Installed (by backend):")
    if have("rpm-ostree"):
        print("--- rpm-ostree ---")
        run(["rpm-ostree", "status"])
    if have("dnf5"):
        print("--- dnf ---")
        run(["dnf5","list","installed"])
    if have("flatpak"):
        print("--- flatpak ---")
        run(["flatpak","list"])
    return 0

def cmd_search(a):
    q = a.query
    detect_backends()
    shown = False
    if have("dnf5"):
        code, out = capture(["dnf5","search",q])
        if code == 0: print(out); shown=True
    if have("flatpak"):
        code, out = capture(["flatpak","search",q])
        if code == 0: print(out); shown=True
    if not shown:
        warn("No results or backend unavailable")
    return 0

def cmd_install(a):
    name = a.name
    detect_backends()
    tried = False
    # Prefer dnf if available (may fail on read-only)
    if have("dnf5"):
        tried = True
        auto_sudo(["dnf5","install","-y",name])
    # Flatpak
    if have("flatpak"):
        if "." in name:
            auto_sudo(["flatpak","install","-y",name])
        else:
            auto_sudo(["flatpak","install","-y","flathub",name])
    if not tried and not have("flatpak"):
        err("No supported backend found")
        return 1
    ok("Install completed")
    return 0

def cmd_remove(a):
    name = a.name
    detect_backends()
    tried = False
    if have("dnf5") and not have("rpm-ostree"):
        tried = True
        auto_sudo(["dnf5","remove","-y",name])
    if have("flatpak"):
        if "." in name:
            auto_sudo(["flatpak","uninstall","-y",name])
        run(["flatpak","remove","--unused","-y"])
    if not tried and not have("flatpak"):
        err("No supported backend found")
        return 1
    ok("Uninstall completed")
    return 0

def cmd_self_update(a):
    force = bool(getattr(a, "force", False))
    return self_update(force=force)

def cmd_uninstall_self(_):
    paths = [
        os.path.expanduser("~/.local/share/solarneo"),
        os.path.expanduser("~/.config/solarneo"),
        os.path.expanduser("~/.cache/solarneo"),
        os.path.expanduser("~/.local/bin/solar"),
        "/usr/local/share/solarneo",
        "/usr/local/bin/solar",
    ]
    for p in paths:
        dbg("Removing: " + p)
        if os.path.isdir(p):
            try:
                shutil.rmtree(p, ignore_errors=True)
            except Exception:
                pass
        elif os.path.isfile(p):
            try: os.remove(p)
            except OSError: pass
    ok("Solar Neo removed")
    warn("Run `hash -r` or open a new shell to refresh PATH.")
    return 0

def main(argv=None):
    ap = argparse.ArgumentParser(prog="solar", add_help=True)
    ap.add_argument("-V","--version", action="store_true", help="show version and exit")

    sub = ap.add_subparsers(dest="cmd")
    sub.add_parser("sys", help="system diagnostics")
    sub.add_parser("list", help="list installed items")
    ps = sub.add_parser("search", help="search packages/apps"); ps.add_argument("query")
    pi = sub.add_parser("install", help="install a package/app"); pi.add_argument("name")
    pr = sub.add_parser("remove", help="remove a package/app"); pr.add_argument("name")
    pu = sub.add_parser("self-update", help="update Solar Neo from GitHub")
    pu.add_argument("--force", action="store_true", help="force update/downgrade even if remote is older")
    sub.add_parser("uninstall-self", help="remove Solar Neo from your user environment")

    args = ap.parse_args(argv)

    if args.version:
        print(f"{__product__} {__version__} — {__codename__}")
        return 0

    if args.cmd is None:
        header(f"{__product__} — {__version__}", f"PROJECT: {__codename__}", by=USER)
        print("Try: solar sys")
        return 0

    if args.cmd == "sys": return cmd_sys(args)
    if args.cmd == "list": return cmd_list(args)
    if args.cmd == "search": return cmd_search(args)
    if args.cmd == "install": return cmd_install(args)
    if args.cmd == "remove": return cmd_remove(args)
    if args.cmd == "self-update": return cmd_self_update(args)
    if args.cmd == "uninstall-self": return cmd_uninstall_self(args)

    ap.print_help()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

import argparse, os, shutil, sys, getpass
from . import __version__, __codename__, __product__
from .utils.pretty import header, info, ok, warn, err
from .utils.run import run, capture, have
from .utils.sys import sys_check
from .utils.update import self_update

USER = os.environ.get("USER") or getpass.getuser()

# Debug logger
def dbg(msg):
    print(f"[DEBUG] {msg}")

def detect_backend():
    backends = []
    if have("rpm-ostree"): backends.append("rpm-ostree")
    if have("dnf5"): backends.append("dnf")
    if have("pacman"): backends.append("pacman")
    if have("apt"): backends.append("apt")
    if have("flatpak"): backends.append("flatpak")
    dbg(f"Detected backends: {', '.join(backends) if backends else 'NONE'}")
    return backends

def cmd_sys(_):
    dbg("System diagnostics triggered")
    detect_backend()
    sys_check(USER, __version__, __codename__)
    return 0

def cmd_list(_):
    dbg("Listing installed software from all available backends")
    detect_backend()
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

def auto_sudo(cmd: list):
    dbg(f"Running command: {' '.join(cmd)}")
    code = run(cmd)
    if code != 0:
        warn("Command failed, retrying with sudo…")
        code = run(["sudo"] + cmd)
    return code

def cmd_search(a):
    q = a.query
    dbg(f"Searching for: {q}")
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
    dbg(f"Requested install: {name}")
    detect_backend()
    tried = False
    if have("dnf5"):
        dbg("Trying DNF backend")
        tried = True
        auto_sudo(["dnf5","install","-y",name])
    if have("flatpak"):
        dbg("Trying Flatpak fallback")
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
    dbg(f"Requested removal: {name}")
    detect_backend()
    tried = False
    if have("dnf5"):
        dbg("Trying DNF removal")
        tried = True
        auto_sudo(["dnf5","remove","-y",name])
    if have("flatpak"):
        dbg("Trying Flatpak removal")
        if "." in name:
            auto_sudo(["flatpak","uninstall","-y",name])
    if not tried and not have("flatpak"):
        err("No supported backend found")
        return 1
    ok("Uninstall completed")
    return 0

def cmd_self_update(_):
    dbg("Self-update triggered")
    return self_update()

def cmd_uninstall_self(_):
    dbg("Removing Solar Neo user installation")
    paths = [
        os.path.expanduser("~/.local/share/solar-neo"),
        os.path.expanduser("~/.config/solar-neo"),
        os.path.expanduser("~/.cache/solar-neo"),
        os.path.expanduser("~/.local/bin/solar"),
    ]
    for p in paths:
        dbg(f"Removing: {p}")
        if os.path.isdir(p):
            shutil.rmtree(p, ignore_errors=True)
        elif os.path.isfile(p):
            try: os.remove(p)
            except OSError: pass
    ok("Solar Neo removed")
    warn("Run `hash -r` or reopen shell")
    return 0

def main(argv=None):
    ap = argparse.ArgumentParser(prog="solar", add_help=True)
    ap.add_argument("-V","--version", action="store_true", help="show version and exit")

    sub = ap.add_subparsers(dest="cmd")
    sub.add_parser("sys", help="system diagnostics")
    sub.add_parser("list", help="list installed software")
    ps = sub.add_parser("search", help="search apps"); ps.add_argument("query")
    pi = sub.add_parser("install", help="install a package"); pi.add_argument("name")
    pr = sub.add_parser("remove", help="remove a package"); pr.add_argument("name")
    sub.add_parser("self-update", help="update Solar Neo")
    sub.add_parser("uninstall-self", help="remove Solar Neo")

    args = ap.parse_args(argv)

    if args.version:
        print(f"{__product__} v{__version__} — {__codename__}")
        return 0

    if args.cmd is None:
        header(f"{__product__} — v{__version__}",
               f"PROJECT: {__codename__}",
               by=USER)
        print("Try: solar sys")
        return 0

    dbg(f"Command: {args.cmd}")

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

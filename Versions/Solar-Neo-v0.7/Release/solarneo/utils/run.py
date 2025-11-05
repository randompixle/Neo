import os, sys, datetime
from .system import (
    ensure_dirs, latest_version, installed_version,
    get_notes, add_note, add_dev_note, update_to
)
from .colors import blue, green, yellow, red, mag, cyan, dim, banner
from .. import __version__
from .system import (
    install_pkg, remove_pkg, search_pkgs, detect_backends
)


def fmt_time(ms):
    try:
        dt = datetime.datetime.fromtimestamp(ms/1000.0)
        return dt.strftime("%b %d %Y")
    except Exception:
        return "unknown"

def ui_head():
    print(banner("Solar Neo CLI"))
    print(dim("A Pakage manager built for you\n"))

def cmd_version():
    ui_head()
    curr = installed_version()
    print(cyan("⮞ ") + "current: " + green(curr))
    lv = latest_version()
    if not lv:
        print(yellow("⮞ ") + "latest : (offline)")
        return 0
    print(cyan("⮞ ") + "latest : " + blue(lv))
    print()
    if lv == curr:
        print(green("status: up-to-date ✓"))
        return 0
    print(red("status: outdated ✗"))
    print(yellow("\nA new version is available."))
    ans = input("Install now? [Y/n] ").strip().lower()
    if ans in ("", "y", "yes"):
        ok, msg = update_to(lv)
        if ok: print(green("\nupdate complete ✓"))
        else:  print(red(f"\nupdate failed: {msg}"))
    return 0

def cmd_update():
    ui_head()
    curr = installed_version()
    lv = latest_version()
    if not lv:
        print(red("cannot reach update server")); return 1
    if lv == curr:
        print(green("already up-to-date ✓")); return 0
    print(yellow(f"update → {lv}"));
    ans = input("Proceed? [Y/n] ").strip().lower()
    if ans in ("", "y", "yes"):
        ok, msg = update_to(lv)
        if ok: print(green("update complete ✓"))
        else:  print(red(f"update failed: {msg}"))
    return 0

def cmd_notes(args):
    ui_head()
    if len(args) < 1:
        print(red("usage: solar notes <app> [add [text]]")); return 1
    app = args[0]
    if len(args) >= 2 and args[1] == "add":
        text = " ".join(args[2:]) if len(args) >= 3 else input("note: ").strip()
        if not text:
            print(yellow("cancelled")); return 1
        if add_note(app, text):
            print(green("note posted ✓"))
        else:
            print(red("failed to post note"))
        return 0

    # view
    data = get_notes(app)
    comm = data.get("community",[]) or []
    dev  = data.get("developer",[]) or []
    print(blue(f"Community notes for {app}:"))
    if not comm:
        print(dim("  (no community notes)"))
    else:
        for n in comm:
            print(f"  - [{fmt_time(n.get('time',0))}] {n.get('msg','').strip()}")
    print()
    print(mag("Developer notes:"))
    if not dev:
        print(dim("  (no developer notes)"))
    else:
        for n in dev:
            print(f"  - [{fmt_time(n.get('time',0))}] {n.get('msg','').strip()}")
    return 0

def cmd_devnote(args):
    ui_head()
    if len(args) < 1:
        print(red('usage: solar devnote add <app> ["text"]')); return 1
    if args[0] != "add" or len(args) < 2:
        print(red('usage: solar devnote add <app> ["text"]')); return 1
    app  = args[1]
    text = " ".join(args[2:]) if len(args) >= 3 else input("dev note: ").strip()
    token = os.environ.get("SOLAR_DEV_TOKEN","")
    if not token:
        print(red("missing SOLAR_DEV_TOKEN")); return 1
    if not text:
        print(yellow("cancelled")); return 1
    if add_dev_note(app, text, token):
        print(green("dev note posted ✓"))
    else:
        print(red("failed to post dev note"))
    return 0


def cmd_sys():
    ui_head()
    print("⮞ backends:", ", ".join(detect_backends()) or "none")
    return 0

def cmd_search(args):
    ui_head()
    if not args: return usage() or 1
    if not search_pkgs(" ".join(args)):
        print("no matches")
    return 0

def cmd_install(args):
    ui_head()
    if not args: return usage() or 1
    ok,msg = install_pkg(args[0])
    print("✔ done" if ok else f"✗ {msg}")
    return 0 if ok else 1

def cmd_remove(args):
    ui_head()
    if not args: return usage() or 1
    ok,msg = remove_pkg(args[0])
    print("✔ removed" if ok else f"✗ {msg}")
    return 0 if ok else 1

def usage():
    ui_head()
    print("Commands:")
    print("  solar version")
    print("  solar update")
    print("  solar notes <app>                # view")
    print('  solar notes <app> add ["text"]   # add community note')
    print('  solar devnote add <app> ["text"] # add developer note (needs SOLAR_DEV_TOKEN)')
    print("  solar sys")
    print("  solar search <query>")
    print("  solar install <name>")
    print("  solar remove <name>")


def main(argv):
    ensure_dirs()
    if len(argv) <= 1:
        usage(); return 0
    cmd = argv[1]
    if cmd in ("version","-v","--version"): return cmd_version()
    if cmd == "update": return cmd_update()
    if cmd == "notes":  return cmd_notes(argv[2:])
    if cmd == "devnote": return cmd_devnote(argv[2:])
    if cmd == "sys":     return cmd_sys()
    if cmd == "search":  return cmd_search(argv[2:])
    if cmd == "install": return cmd_install(argv[2:])
    if cmd == "remove":  return cmd_remove(argv[2:])

    usage(); return 1

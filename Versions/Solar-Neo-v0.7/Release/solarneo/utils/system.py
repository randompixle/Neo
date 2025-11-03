import os, platform, shutil
from .colors import info, ok, warn

def _check(cmd):
    return shutil.which(cmd) is not None

def sys_check(debug=False):
    info("Solar Neo diagnostics")
    print("---- system ----")
    print(f"os: {platform.system()} {platform.release()}")
    print(f"user: {os.environ.get('USER') or ''}")
    print("---- backends ----")
    print(f"dnf5:    {'yes' if _check('dnf5') else 'no'}")
    print(f"flatpak: {'yes' if _check('flatpak') else 'no'}")
    print("---- path ----")
    print(os.environ.get("PATH",""))

    hints=[]
    if not _check('dnf5'): hints.append("dnf5 missing")
    if not _check('flatpak'): hints.append("flatpak missing")
    if hints:
        warn(" ".join(hints))
    ok("System looks good!" if not hints else "Diagnostics complete.")
    return 0

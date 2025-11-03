
import os, shutil, platform
from .pretty import header, ok, warn

def sys_check(user, version, codename):
    header(f"Solar Neo — v{version}", f"PROJECT: {codename} ☀️", by=user)
    have = shutil.which
    print("Backends:")
    print(f"  rpm-ostree : {'yes' if have('rpm-ostree') else 'no'}")
    print(f"  dnf5       : {'yes' if have('dnf5') else 'no'}")
    print(f"  flatpak    : {'yes' if have('flatpak') else 'no'}")
    ro_hint = " (read-only OSTree)" if have('bootc') or have('rpm-ostree') else ""
    print(f"\nSystem: Linux {platform.release()}{ro_hint}")
    ok("diagnostics complete")

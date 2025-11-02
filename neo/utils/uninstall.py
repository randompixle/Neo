
import os, shutil
from .pretty import ok, warn

def uninstall_self():
    targets = [
        os.path.expanduser('~/.local/share/neo'),
        os.path.expanduser('~/.local/state/neo'),
        os.path.expanduser('~/.config/neo'),
        os.path.expanduser('~/.local/bin/neo'),
        os.path.expanduser('~/.local/bin/neo.sh'),
    ]
    for p in targets:
        if os.path.isfile(p):
            try: os.remove(p)
            except Exception: pass
        elif os.path.isdir(p):
            shutil.rmtree(p, ignore_errors=True)
    ok('neo removed from your user environment.')
    warn('Run `hash -r` or open a new shell to refresh PATH.')
    return 0

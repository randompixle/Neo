
import platform, shutil
from .pretty import PURPLE, BLUE, BOLD, RESET, ok

def banner(version, codename, user):
    title = f'Neo Package Manager — v{version}\nPROJECT: ECLIPSE'
    line = '═' * max(len(title.split('\n')[0]), len(title.split('\n')[1]))
    print(f"{PURPLE}{BOLD}{line}{RESET}")
    print(f"{PURPLE}{BOLD}{title}{RESET}")
    print(f"{BLUE}powered by {user}{RESET}")
    print(f"{PURPLE}{BOLD}{line}{RESET}")

def sys_check(version, codename, user):
    banner(version, codename, user)
    print('')
    print(' Backends:')
    print(f"  - rpm-ostree : {'yes' if shutil.which('rpm-ostree') else 'no'}")
    print(f"  - dnf5       : {'yes' if shutil.which('dnf5') else 'no'}")
    print(f"  - flatpak    : {'yes' if shutil.which('flatpak') else 'no'}")
    print('')
    ok('System looks good!')

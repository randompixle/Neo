
import argparse, os, shutil, sys
from . import __version__, __codename__
from .utils.pretty import info, ok, warn, err
from .utils.update import self_update
from .utils.uninstall import uninstall_self
from .utils.sys_check import sys_check
from .utils.run import run, run_capture
from .utils.format import format_rows

USER = os.environ.get('USER') or os.path.basename(os.path.expanduser('~'))

def detect_backend():
    if shutil.which('rpm-ostree'): return 'rpm-ostree'
    if shutil.which('dnf5'): return 'dnf'
    if shutil.which('pacman'): return 'pacman'
    if shutil.which('apt'): return 'apt'
    return None

def cmd_search(args):
    name = args.query
    backend = detect_backend()
    results = []
    if backend in ('rpm-ostree','dnf'):
        code, out = run_capture(['dnf5','search',name])
        if code == 0:
            for line in out.splitlines():
                if not line or line.startswith(('Updating','Repositories','Matched','Name')): 
                    continue
                # Very rough parse
                parts = line.split()
                pkg = parts[0]
                desc = ' '.join(parts[1:]) if len(parts)>1 else ''
                results.append({'name': pkg, 'desc': desc})
    if shutil.which('flatpak'):
        code, out = run_capture(['flatpak','search',name])
        if code == 0:
            for ln in out.splitlines()[1:]:
                cols = ln.split()
                if cols:
                    results.append({'name': cols[0], 'desc': '(flatpak)'})
    if results:
        for ln in format_rows(results):
            print(ln)
        ok('search complete')
    else:
        warn('no results (or backend unavailable)')

def cmd_list(args):
    backend = detect_backend()
    info('Installed (by backend):')
    if backend == 'rpm-ostree':
        print('--- rpm-ostree ---')
        run(['rpm-ostree','status'])
    if shutil.which('dnf5'):
        print('--- dnf ---')
        run(['dnf5','list','installed'])
    if shutil.which('flatpak'):
        print('--- flatpak ---')
        run(['flatpak','list'])

def cmd_install(args):
    pkg = args.name
    backend = detect_backend()
    tried=False
    if backend in ('rpm-ostree','dnf'):
        tried=True
        run(['sudo','dnf5','install','-y',pkg])
    if shutil.which('flatpak'):
        run(['flatpak','install','-y',pkg])
    if not tried:
        err('no supported backend found')
        return 1
    ok('install finished')
    return 0

def cmd_remove(args):
    pkg = args.name
    backend = detect_backend()
    tried=False
    if backend in ('rpm-ostree','dnf'):
        tried=True
        run(['sudo','dnf5','remove','-y',pkg])
    if shutil.which('flatpak'):
        run(['flatpak','uninstall','-y',pkg])
    if not tried:
        err('no supported backend found')
        return 1
    ok('remove finished')
    return 0

def main(argv=None):
    p = argparse.ArgumentParser(prog='neo')
    p.add_argument('-v','--version', action='store_true', help='show version and exit')
    sub = p.add_subparsers(dest='cmd')
    sub.add_parser('self-update', help='update neo from GitHub release')
    sub.add_parser('uninstall-self', help='remove neo from your user environment')
    sub.add_parser('sys-check', help='system check (neofetch-style banner)')
    ps = sub.add_parser('search', help='search packages/apps'); ps.add_argument('query')
    pi = sub.add_parser('install', help='install a package/app'); pi.add_argument('name')
    pr = sub.add_parser('remove', help='remove a package/app'); pr.add_argument('name')
    sub.add_parser('list', help='list installed items (by backend)')

    args = p.parse_args(argv)

    if args.version:
        print(f'neo v{__version__} — {__codename__}')
        return 0

    if args.cmd is None:
        # No args -> show banner + hint
        from .utils.sys_check import banner
        banner(__version__, __codename__, USER)
        print('Try: neo sys-check')
        return 0

    if args.cmd == 'self-update': return self_update()
    if args.cmd == 'uninstall-self': return uninstall_self()
    if args.cmd == 'sys-check': return sys_check(__version__, __codename__, USER)
    if args.cmd == 'search': return cmd_search(args)
    if args.cmd == 'install': return cmd_install(args)
    if args.cmd == 'remove': return cmd_remove(args)
    if args.cmd == 'list': return cmd_list(args)

    p.print_help()
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

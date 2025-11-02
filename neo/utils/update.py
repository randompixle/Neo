
import os, tempfile, zipfile, shutil, json
from urllib.request import urlopen
from .pretty import ok, err, warn, info, celebrate
from .. import __version__

API = 'https://api.github.com/repos/randompixle/Neo/releases/latest'

def _latest():
    try:
        with urlopen(API) as r:
            data = json.load(r)
        tag = data.get('tag_name','').lstrip('v')
        assets = data.get('assets', [])
        zip_url = None
        for a in assets:
            if a.get('name','').endswith('.zip'):
                zip_url = a.get('browser_download_url')
                break
        return tag, zip_url
    except Exception as e:
        warn(f'GitHub releases check failed: {e}')
        return None, None

def self_update():
    info('Checking for updates…')
    latest, zip_url = _latest()
    if not latest:
        warn('No release info found on GitHub.')
        return 1
    if latest == __version__:
        ok(f'neo is already up to date (v{__version__})')
        return 0
    if not zip_url:
        err('Latest release has no .zip asset.')
        return 1

    tmp = tempfile.mkdtemp(prefix='neo-update-')
    zpath = os.path.join(tmp, 'neo.zip')
    try:
        info('Downloading update…')
        with urlopen(zip_url) as r, open(zpath, 'wb') as f:
            shutil.copyfileobj(r, f)
        info('Extracting…')
        with zipfile.ZipFile(zpath) as z:
            z.extractall(tmp)
        # find extracted top folder
        subdirs = [os.path.join(tmp, d) for d in os.listdir(tmp) if os.path.isdir(os.path.join(tmp, d))]
        root = next((d for d in subdirs if 'Neo' in d or 'neo' in d), None)
        if not root:
            err('Could not locate extracted project folder.')
            return 1
        installer = os.path.join(root, 'install.sh')
        if not os.path.exists(installer):
            err('install.sh not found in archive.')
            return 1
        from .run import run
        info('Installing update…')
        rc = run(['bash', installer], use_sudo=False, check=False)
        if rc != 0:
            err('Installer failed.')
            return rc
        celebrate(f'neo updated to v{latest}! (thanks, Alen)')
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

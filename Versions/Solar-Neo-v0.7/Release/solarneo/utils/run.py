import shutil, subprocess

def have(cmd: str) -> bool:
    return shutil.which(cmd) is not None

def run(argv, debug=False, use_sudo=False):
    if use_sudo: argv = ["sudo"] + list(argv)
    if debug: print(f"[DEBUG] run: {' '.join(argv)}")
    return subprocess.call(argv)

def capture(argv, debug=False):
    if debug: print(f"[DEBUG] capture: {' '.join(argv)}")
    proc = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    out, _ = proc.communicate()
    return proc.returncode, out

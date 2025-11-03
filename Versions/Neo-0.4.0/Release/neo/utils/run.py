
import subprocess

def run(cmd, use_sudo=False, check=False):
    if use_sudo:
        cmd = ["sudo"] + list(cmd)
    try:
        proc = subprocess.run(cmd, check=check)
        return proc.returncode
    except FileNotFoundError:
        print(f"$ {' '.join(cmd)}")
        print('Command not found')
        return 127

def run_capture(cmd):
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
        return 0, out
    except subprocess.CalledProcessError as e:
        return e.returncode, e.output
    except FileNotFoundError:
        return 127, ""

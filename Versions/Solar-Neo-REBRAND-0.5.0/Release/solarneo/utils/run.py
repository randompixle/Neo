
import subprocess, shutil

def have(cmd): return shutil.which(cmd) is not None

def run(cmd, check=False):
    try:
        return subprocess.run(cmd, check=check).returncode
    except FileNotFoundError:
        print("$ "+" ".join(cmd))
        print("Command not found")
        return 127

def capture(cmd):
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True)
        return 0, out
    except subprocess.CalledProcessError as e:
        return e.returncode, e.output
    except FileNotFoundError:
        return 127, ""

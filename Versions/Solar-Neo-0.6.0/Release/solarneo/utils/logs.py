import os

def _log_dir():
    base = os.path.expanduser("~/.local/share/solarneo/logs")
    os.makedirs(base, exist_ok=True)
    return base

def _active():
    return os.path.join(_log_dir(), "update.log")

def rotate(max_files=5):
    base = _log_dir()
    last = os.path.join(base, f"update.{max_files}.log")
    if os.path.exists(last):
        os.remove(last)
    for i in range(max_files-1, -1, -1):
        src = os.path.join(base, f"update.{i}.log") if i>0 else os.path.join(base, "update.log")
        dst = os.path.join(base, f"update.{i+1}.log")
        if os.path.exists(src):
            os.rename(src, dst)

def write(line):
    path = _active()
    with open(path, "a", encoding="utf-8") as f:
        f.write(line.rstrip()+"\n")

def stamp(level, msg):
    import datetime
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    write(f"[{ts}] {level} {msg}")


import os, sys

RESET = "\033[0m"
BOLD = "\033[1m"
PURPLE = "\033[95m"
BLUE = "\033[94m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def supports_color():
    return sys.stdout.isatty() and os.environ.get("TERM","") != "dumb"

def tint(s, color):
    return f"{color}{s}{RESET}" if supports_color() else s

def ok(msg): print(tint("✔ " + msg, GREEN))
def info(msg): print(tint("ℹ " + msg, CYAN))
def warn(msg): print(tint("⚠ " + msg, YELLOW))
def err(msg): print(tint("✖ " + msg, RED), file=sys.stderr)
def celebrate(msg): print(tint("🎉 " + msg, PURPLE))

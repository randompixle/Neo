
import os, sys

RESET = "\033[0m"
BOLD = "\033[1m"
PURPLE = "\033[95m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def enabled():
    return sys.stdout.isatty() and os.environ.get("TERM","") != "dumb"

def c(s, color): return f"{color}{s}{RESET}" if enabled() else s
def ok(msg): print(c("✔ "+msg, GREEN))
def info(msg): print(c("ℹ "+msg, CYAN))
def warn(msg): print(c("⚠ "+msg, YELLOW))
def err(msg): print(c("✖ "+msg, RED), file=sys.stderr)

def header(title, subtitle=None, by=None):
    line = "═"*max(len(title), len(subtitle or ""))
    print(c(line, PURPLE))
    print(c(title, PURPLE+ BOLD))
    if subtitle:
        print(c(subtitle, PURPLE))
    if by:
        print(c(f"powered by {by}", PURPLE))
    print(c(line, PURPLE))

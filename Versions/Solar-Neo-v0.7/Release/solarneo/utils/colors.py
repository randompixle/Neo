import sys

def _c(code): return f"\033[{code}m" if sys.stdout.isatty() else ""
def info(msg): print(f"{_c('36')}ℹ{_c('0')} {msg}")
def ok(msg):   print(f"{_c('32')}✔{_c('0')} {msg}")
def warn(msg): print(f"{_c('33')}⚠{_c('0')} {msg}")
def err(msg):  print(f"{_c('31')}✖{_c('0')} {msg}")

# tiny ANSI helpers
def _c(txt, code): return f"\033[{code}m{txt}\033[0m"

def blue(t):   return _c(t, "34")
def green(t):  return _c(t, "32")
def yellow(t): return _c(t, "33")
def red(t):    return _c(t, "31")
def mag(t):    return _c(t, "35")
def cyan(t):   return _c(t, "36")
def dim(t):    return _c(t, "90")

def banner(line="Solar Neo"):
    return mag("≡") + cyan(" " + line) + mag(" ≡")

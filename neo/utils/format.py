
from shutil import get_terminal_size
from .pretty import GREEN, CYAN, RESET

def _w():
    try: return get_terminal_size((80, 20)).columns
    except Exception: return 80

def format_rows(items):
    if not items: return []
    width = _w()
    name_w = min(max(len(i['name']) for i in items), max(18, width//3))
    lines = []
    for it in items:
        name = it.get('name', '')
        desc = it.get('desc', '')
        nm = (name[:name_w-1] + '…') if len(name) > name_w else name.ljust(name_w)
        lines.append(f"{GREEN}{nm}{RESET}  {CYAN}{desc}{RESET}")
    return lines

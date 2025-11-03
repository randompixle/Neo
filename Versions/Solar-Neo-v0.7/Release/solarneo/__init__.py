from pathlib import Path

# Resolve version from VERSION.txt beside the executable if present
def _read_version():
    # try Release/VERSION.txt (running from tree)
    here = Path(__file__).resolve()
    for p in [here.parent.parent/'VERSION.txt', Path.home()/'.local/share/solarneo/VERSION.txt']:
        try:
            return p.read_text(encoding='utf-8').strip()
        except Exception:
            pass
    return "0.7.0"

__version__  = _read_version()
__codename__ = "SOLAR NEO"
__product__  = "Solar Neo"

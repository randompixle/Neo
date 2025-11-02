
# Legacy entry kept for older wrappers; forwards to package main.
from .__main__ import main

if __name__ == '__main__':
    raise SystemExit(main())

import re

# Accepts 'v1.2.3', '1.2.3', 'v0.6', '0.6', and optional suffixes like '-stable'
_semver = re.compile(r"^v?(\\d+)(?:\\.(\\d+))?(?:\\.(\\d+))?(?:[-+].*)?$")

def parse(v: str):
    m = _semver.match(v.strip())
    if not m:
        return None
    nums = [int(x) if x is not None else 0 for x in m.groups()]
    # Normalize to (major, minor, patch)
    if len(nums) == 3:
        return tuple(nums)
    elif len(nums) == 2:
        return (nums[0], nums[1], 0)
    else:
        return (nums[0], 0, 0)

def cmp(a: str, b: str):
    pa, pb = parse(a), parse(b)
    if pa is None or pb is None:
        return None
    return (pa > pb) - (pa < pb)

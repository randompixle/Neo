import urllib.request, urllib.parse, json
from .colors import info, ok, warn, err

API_BASE = "https://solar-a-pi.vercel.app/api/client_api"

def api_get(cmd, **params):
    try:
        url = f"{API_BASE}?cmd={cmd}"
        if params:
            url += "&" + urllib.parse.urlencode(params)
        with urllib.request.urlopen(url) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        err(f"API GET failed: {e}")
        return None

def api_post(cmd, data):
    try:
        url = f"{API_BASE}?cmd={cmd}"
        payload = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=payload,
                                     headers={"Content-Type":"application/json"})
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        err(f"API POST failed: {e}")
        return None

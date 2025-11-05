__version__ = "v0.7"

# API + repo constants
API_BASE      = "https://solar-a-pi.vercel.app/api/client_api"
GITHUB_OWNER  = "randompixle"
GITHUB_REPO   = "Solar-Neo"

# Release asset naming (client-only zip)
def asset_name(tag: str) -> str:
    # Example expected on GitHub Releases: Solar-Neo_v0.7.zip
    return f"Solar-Neo_{tag}.zip"

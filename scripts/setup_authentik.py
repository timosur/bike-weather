#!/usr/bin/env python3
"""Bootstrap Authentik with bike-weather OAuth2 application.

Run after `docker compose up` to provision the OIDC provider and application.
Idempotent — safe to re-run.

Usage:
    python3 scripts/setup_authentik.py
"""

import json
import os
import sys
import urllib.request
import urllib.error

BASE = os.environ.get("AUTHENTIK_URL", "http://localhost:9000")

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def api(method: str, path: str, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        f"{BASE}{path}", data=body, headers=HEADERS, method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            if not content:
                return {}
            return json.loads(content)
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ERROR {e.code}: {err[:300]}")
        try:
            return json.loads(err)
        except json.JSONDecodeError:
            return {}


def ensure_api_token() -> str:
    """Create an API token via Django ORM inside the container."""
    import subprocess

    code = (
        "import os, django; "
        "os.environ['DJANGO_SETTINGS_MODULE']='authentik.root.settings'; "
        "django.setup(); "
        "from authentik.core.models import Token, TokenIntents, User; "
        "u=User.objects.get(username='akadmin'); "
        "t,_=Token.objects.get_or_create("
        "identifier='bike-weather-setup',"
        "defaults={'user':u,'intent':TokenIntents.INTENT_API,'expiring':False}); "
        "print(t.key)"
    )
    result = subprocess.run(
        ["docker", "exec", "bikeweather-authentik-server", "python", "-c", code],
        capture_output=True,
        text=True,
    )
    token = result.stdout.strip().split("\n")[-1]
    if not token or len(token) < 10:
        print(
            f"Failed to get API token.\nstdout: {result.stdout}\nstderr: {result.stderr}"
        )
        sys.exit(1)
    return token


def main():
    print("=== Authentik Bootstrap for bike-weather ===\n")

    # Obtain API token
    print("1. Obtaining API token...")
    token = ensure_api_token()
    HEADERS["Authorization"] = f"Bearer {token}"
    print(f"   Token obtained (***{token[-6:]})")

    # Get signing key
    print("2. Getting signing certificate...")
    certs = api(
        "GET",
        "/api/v3/crypto/certificatekeypairs/?name=authentik+Self-signed+Certificate",
    )
    if not certs.get("results"):
        print("   ERROR: No self-signed certificate found!")
        sys.exit(1)
    cert_pk = certs["results"][0]["pk"]
    print(f"   Certificate: {cert_pk}")

    # Get flows
    print("3. Getting flows...")
    flows = api("GET", "/api/v3/flows/instances/")
    auth_flow = invalidation_flow = None
    for f in flows["results"]:
        if f["slug"] == "default-provider-authorization-implicit-consent":
            auth_flow = f["pk"]
        if f["slug"] == "default-provider-invalidation-flow":
            invalidation_flow = f["pk"]
    if not auth_flow or not invalidation_flow:
        print("   ERROR: Required flows not found!")
        sys.exit(1)
    print(f"   Authorization flow: {auth_flow}")
    print(f"   Invalidation flow:  {invalidation_flow}")

    # Get scope mappings
    print("4. Getting scope mappings...")
    scopes = api("GET", "/api/v3/propertymappings/provider/scope/")
    scope_map = {s["scope_name"]: s["pk"] for s in scopes.get("results", [])}
    mappings = [scope_map[n] for n in ("openid", "profile", "email") if n in scope_map]
    print(f"   Mapped scopes: openid, profile, email")

    # Create or find OAuth2 provider
    print("5. Provisioning OAuth2 provider...")
    existing = api("GET", "/api/v3/providers/oauth2/?search=bike-weather")
    if existing.get("results"):
        provider_pk = existing["results"][0]["pk"]
        print(f"   Already exists (pk={provider_pk})")
    else:
        provider = api(
            "POST",
            "/api/v3/providers/oauth2/",
            {
                "name": "bike-weather",
                "authorization_flow": auth_flow,
                "invalidation_flow": invalidation_flow,
                "client_type": "public",
                "client_id": "bike-weather",
                "redirect_uris": [
                    {
                        "matching_mode": "strict",
                        "url": "http://localhost:5173/auth/callback",
                    },
                ],
                "signing_key": cert_pk,
                "access_code_validity": "minutes=10",
                "access_token_validity": "hours=1",
                "refresh_token_validity": "days=30",
                "sub_mode": "hashed_user_id",
                "include_claims_in_id_token": True,
                "property_mappings": mappings,
            },
        )
        provider_pk = provider.get("pk")
        if not provider_pk:
            print("   FAILED to create provider!")
            sys.exit(1)
        print(f"   Created (pk={provider_pk})")

    # Create or find application
    print("6. Provisioning application...")
    existing_app = api("GET", "/api/v3/core/applications/?slug=bike-weather")
    if existing_app.get("results"):
        print("   Already exists")
    else:
        app = api(
            "POST",
            "/api/v3/core/applications/",
            {
                "name": "Bike Weather",
                "slug": "bike-weather",
                "provider": provider_pk,
                "open_in_new_tab": False,
                "meta_launch_url": "http://localhost:5173",
            },
        )
        if app.get("slug"):
            print(f"   Created: {app['slug']}")
        else:
            print("   FAILED to create application!")
            sys.exit(1)

    # Verify
    print("\n7. Verifying OIDC discovery endpoint...")
    try:
        req = urllib.request.Request(
            f"{BASE}/application/o/bike-weather/.well-known/openid-configuration"
        )
        with urllib.request.urlopen(req) as resp:
            config = json.loads(resp.read())
            print(f"   Issuer: {config.get('issuer')}")
            print(f"   Auth:   {config.get('authorization_endpoint')}")
            print(f"   Token:  {config.get('token_endpoint')}")
            print("   OK")
    except urllib.error.HTTPError as e:
        print(f"   FAILED: {e.code}")
        sys.exit(1)

    # Set default admin password
    print("\n8. Setting akadmin password...")
    result = api("GET", "/api/v3/core/users/?username=akadmin")
    if result.get("results"):
        admin_pk = result["results"][0]["pk"]
        api("POST", f"/api/v3/core/users/{admin_pk}/set_password/",
            {"password": "test1234"})
        print("   Password set to: test1234")

    # Write API token to .env
    print("\n9. Writing AUTHENTIK_API_TOKEN to .env...")
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            lines = f.readlines()
        found = False
        new_lines = []
        for line in lines:
            if line.startswith("AUTHENTIK_API_TOKEN="):
                new_lines.append(f"AUTHENTIK_API_TOKEN={token}\n")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"AUTHENTIK_API_TOKEN={token}\n")
        with open(env_path, "w") as f:
            f.writelines(new_lines)
        print(f"   Written to {env_path}")
    else:
        print(f"   WARNING: {env_path} not found, set AUTHENTIK_API_TOKEN={token} manually")

    print("\n=== Done! Login at http://localhost:5173 ===")
    print(f"   Admin: akadmin / test1234")
    print(f"   API Token: ***{token[-6:]}")


if __name__ == "__main__":
    main()

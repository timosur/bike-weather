#!/usr/bin/env python3
"""Bootstrap Authentik with bike-weather OAuth2 application.

Run after `docker compose up` to provision the OIDC provider and application.
Configures the recovery flow with a custom email template that points
password-reset links to the frontend instead of Authentik's default UI.

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


def setup_recovery_flow():
    """Create or configure the recovery flow with all required stages.

    Creates the flow + stages from scratch if they don't exist (fresh Authentik
    without initial setup wizard), or patches an existing flow's email stage
    to use the custom template.
    """
    print("\n── Recovery flow setup ──")

    flow_slug = "default-recovery-flow"

    # 1. Create or find the recovery flow
    print(f"   Finding {flow_slug}...")
    flows = api("GET", f"/api/v3/flows/instances/?slug={flow_slug}")
    if flows.get("results"):
        flow_pk = flows["results"][0]["pk"]
        print(f"   Found existing flow (pk={flow_pk})")
    else:
        print(f"   Flow not found — creating it...")
        flow = api(
            "POST",
            "/api/v3/flows/instances/",
            {
                "name": "Default recovery flow",
                "slug": flow_slug,
                "title": "Reset your password",
                "designation": "recovery",
                "denied_action": "message_continue",
                "policy_engine_mode": "any",
                "compatibility_mode": True,
            },
        )
        flow_pk = flow.get("pk")
        if not flow_pk:
            print("   FAILED to create recovery flow!")
            return
        print(f"   Flow created (pk={flow_pk})")

    # 2. Get existing bindings to know what's already there
    existing_bindings = api(
        "GET",
        f"/api/v3/flows/bindings/?target={flow_pk}&ordering=order",
    )
    bound_stages = {b["stage"]: b for b in existing_bindings.get("results", [])}
    print(f"   Flow has {len(bound_stages)} existing stage(s)")

    # Check which stage types already exist
    email_stage_pk = None
    for _stage_pk, binding in bound_stages.items():
        meta_model = binding.get("stage_obj", {}).get("meta_model_name", "")
        if "email" in meta_model:
            email_stage_pk = binding["stage"]

    # 3. Create identification stage if needed
    ident_name = f"{flow_slug}-identification"
    existing = api("GET", f"/api/v3/stages/identification/?search={ident_name}")
    if existing.get("results"):
        ident_pk = existing["results"][0]["pk"]
        print(f"   Identification stage exists (pk={ident_pk})")
    else:
        stage = api(
            "POST",
            "/api/v3/stages/identification/",
            {
                "name": ident_name,
                "user_fields": ["email"],
                "case_insensitive_matching": True,
                "show_matched_user": False,
                "pretend_user_exists": True,
            },
        )
        ident_pk = stage.get("pk")
        if ident_pk:
            print(f"   Identification stage created (pk={ident_pk})")
        else:
            print(f"   FAILED to create identification stage: {stage}")

    # 4. Create email stage if needed
    email_name = f"{flow_slug}-email"
    existing = api("GET", f"/api/v3/stages/email/?search={email_name}")
    if existing.get("results"):
        email_stage_pk = existing["results"][0]["pk"]
        print(f"   Email stage exists (pk={email_stage_pk})")
    elif not email_stage_pk:
        stage = api(
            "POST",
            "/api/v3/stages/email/",
            {
                "name": email_name,
                "template": "email/password_reset.html",
                "subject": "Fahrrad Wetter — Password Reset",
                "activate_user_on_success": True,
                "use_global_settings": True,
                "token_expiry": "minutes=30",
            },
        )
        email_stage_pk = stage.get("pk")
        if email_stage_pk:
            print(f"   Email stage created (pk={email_stage_pk})")
        else:
            print(f"   FAILED to create email stage: {stage}")

    # Always patch the email stage template to ensure it's correct
    if email_stage_pk:
        result = api(
            "PATCH",
            f"/api/v3/stages/email/{email_stage_pk}/",
            {
                "template": "email/password_reset.html",
                "subject": "Fahrrad Wetter — Password Reset",
                "activate_user_on_success": True,
            },
        )
        if result.get("pk"):
            print(f"   ✓ Email stage template set to: email/password_reset.html")
        else:
            print(f"   ✗ Failed to update email stage template: {result}")

    # 5. Create password stage if needed
    # Use a user_write stage preceded by a prompt stage for the new password.
    # Authentik's prompt stage uses /api/v3/stages/prompt/stages/ for the stage
    # and /api/v3/stages/prompt/prompts/ for the prompt fields.
    pw_name = f"{flow_slug}-password"
    existing = api("GET", f"/api/v3/stages/prompt/stages/?search={pw_name}")
    if existing.get("results"):
        pw_stage_pk = existing["results"][0]["pk"]
        print(f"   Password stage exists (pk={pw_stage_pk})")
    else:
        # Find or create password prompt fields
        prompts = api("GET", "/api/v3/stages/prompt/prompts/")
        pw_prompt_pk = pw_repeat_pk = None
        for p in prompts.get("results", []):
            if p.get("field_key") == "password":
                pw_prompt_pk = p["pk"]
            elif p.get("field_key") == "password_repeat":
                pw_repeat_pk = p["pk"]

        if not pw_prompt_pk:
            r = api(
                "POST",
                "/api/v3/stages/prompt/prompts/",
                {
                    "name": f"{flow_slug}-password-field",
                    "field_key": "password",
                    "label": "New Password",
                    "type": "password",
                    "required": True,
                    "placeholder": "New Password",
                    "order": 0,
                },
            )
            pw_prompt_pk = r.get("pk")

        if not pw_repeat_pk:
            r = api(
                "POST",
                "/api/v3/stages/prompt/prompts/",
                {
                    "name": f"{flow_slug}-password-repeat-field",
                    "field_key": "password_repeat",
                    "label": "Repeat Password",
                    "type": "password",
                    "required": True,
                    "placeholder": "Repeat Password",
                    "order": 1,
                },
            )
            pw_repeat_pk = r.get("pk")

        fields = [pk for pk in [pw_prompt_pk, pw_repeat_pk] if pk]
        stage = api(
            "POST",
            "/api/v3/stages/prompt/stages/",
            {"name": pw_name, "fields": fields},
        )
        pw_stage_pk = stage.get("pk")
        if pw_stage_pk:
            print(f"   Password stage created (pk={pw_stage_pk})")
        else:
            print(f"   FAILED to create password stage: {stage}")

    # 6. Create user_write stage to persist the password change
    write_name = f"{flow_slug}-user-write"
    existing = api("GET", f"/api/v3/stages/user_write/?search={write_name}")
    if existing.get("results"):
        write_pk = existing["results"][0]["pk"]
        print(f"   User-write stage exists (pk={write_pk})")
    else:
        stage = api(
            "POST",
            "/api/v3/stages/user_write/",
            {"name": write_name, "create_users_as_inactive": False},
        )
        write_pk = stage.get("pk")
        if write_pk:
            print(f"   User-write stage created (pk={write_pk})")
        else:
            print(f"   FAILED to create user-write stage: {stage}")

    # 7. Bind stages to the flow in order
    print("   Binding stages to flow...")
    stage_order = [
        (ident_pk, 0),
        (email_stage_pk, 10),
        (pw_stage_pk, 20),
        (write_pk, 30),
    ]
    for stage_pk, order in stage_order:
        if not stage_pk:
            continue
        if stage_pk in bound_stages:
            print(f"     Stage {stage_pk} already bound")
            continue
        binding = api(
            "POST",
            "/api/v3/flows/bindings/",
            {"target": flow_pk, "stage": stage_pk, "order": order},
        )
        if binding.get("pk"):
            print(f"     Bound stage (order={order})")
        else:
            print(f"     FAILED to bind stage at order {order}: {binding}")

    print(f"   ✓ Recovery flow {flow_slug} ready")


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

    # Set default admin password and email
    print("\n8. Setting akadmin password and email...")
    result = api("GET", "/api/v3/core/users/?username=akadmin")
    if result.get("results"):
        admin_pk = result["results"][0]["pk"]
        api(
            "POST",
            f"/api/v3/core/users/{admin_pk}/set_password/",
            {"password": "test1234"},
        )
        api(
            "PATCH",
            f"/api/v3/core/users/{admin_pk}/",
            {"email": "admin@bike-weather.local"},
        )
        print("   Password set to: test1234")
        print("   Email set to: admin@bike-weather.local")

    # Recovery flow setup
    print("\n9. Configuring recovery flow...")
    setup_recovery_flow()

    # Write API token to .env
    print("\n10. Writing AUTHENTIK_API_TOKEN to .env...")
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
        print(
            f"   WARNING: {env_path} not found, set AUTHENTIK_API_TOKEN={token} manually"
        )

    print("\n=== Done! Login at http://localhost:5173 ===")
    print(f"   Admin: akadmin / test1234")
    print(f"   API Token: ***{token[-6:]}")


if __name__ == "__main__":
    main()

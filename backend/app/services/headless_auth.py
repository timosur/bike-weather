"""Headless authentication against Authentik using the Flow Executor API.

This module drives Authentik's authentication flow server-side so the
frontend never redirects away from the app.  After successful
authentication the module performs a server-side OAuth authorization code
exchange (with PKCE) to obtain real OIDC tokens that the existing
``AuthService.validate_token`` can verify.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import secrets
from urllib.parse import parse_qs, urlparse

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

FLOW_URL = (
    f"{settings.AUTHENTIK_BASE_URL}/api/v3/flows/executor"
    f"/{settings.AUTHENTIK_AUTH_FLOW_SLUG}/"
)
RECOVERY_FLOW_URL = (
    f"{settings.AUTHENTIK_BASE_URL}/api/v3/flows/executor"
    f"/{settings.AUTHENTIK_RECOVERY_FLOW_SLUG}/"
)
AUTHORIZE_URL = f"{settings.AUTHENTIK_BASE_URL}/application/o/authorize/"
TOKEN_URL = f"{settings.AUTHENTIK_BASE_URL}/application/o/token/"
USERS_URL = f"{settings.AUTHENTIK_BASE_URL}/api/v3/core/users/"

REDIRECT_URI = f"{settings.FRONTEND_URL}/auth/callback"

_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


class HeadlessAuthError(Exception):
    """Raised when authentication fails."""


# ── helpers ───────────────────────────────────────────────────────────


def _pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


async def _drive_flow(client: httpx.AsyncClient, uid: str, password: str) -> None:
    """Walk through the Authentik authentication flow stages.

    After this coroutine returns the *client*'s cookie jar holds an
    authenticated Authentik session.
    """
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    # Stage 1 – start the flow (identification stage)
    r = await client.get(FLOW_URL, headers=headers, follow_redirects=True)
    r.raise_for_status()
    data = r.json()
    if data.get("component") != "ak-stage-identification":
        raise HeadlessAuthError(f"Unexpected first stage: {data.get('component')}")

    # Stage 2 – submit identifier
    r = await client.post(
        FLOW_URL,
        json={"uid_field": uid},
        headers=headers,
        follow_redirects=True,
    )
    r.raise_for_status()
    data = r.json()

    # Some Authentik setups combine identification + password on one page
    if data.get("component") == "ak-stage-identification":
        # Identification stage with password_fields=True
        r = await client.post(
            FLOW_URL,
            json={"uid_field": uid, "password": password},
            headers=headers,
            follow_redirects=True,
        )
        r.raise_for_status()
        data = r.json()
    elif data.get("component") == "ak-stage-password":
        # Separate password stage
        r = await client.post(
            FLOW_URL,
            json={"password": password},
            headers=headers,
            follow_redirects=True,
        )
        r.raise_for_status()
        data = r.json()
    else:
        raise HeadlessAuthError(
            f"Unexpected stage after identification: {data.get('component')}"
        )

    # Check for errors in the response
    if data.get("response_errors"):
        errors = data["response_errors"]
        # Extract first error message
        for _field, field_errors in errors.items():
            if field_errors:
                msg = field_errors[0].get("string", "Authentication failed")
                raise HeadlessAuthError(msg)

    # Should now be xak-flow-redirect (flow complete) or similar
    component = data.get("component", "")
    if component not in ("xak-flow-redirect", "xak-flow-shell"):
        raise HeadlessAuthError(f"Flow did not complete. Stage: {component}")


async def _exchange_tokens(client: httpx.AsyncClient) -> dict:
    """Use the authenticated session to perform an OAuth code exchange."""
    verifier, challenge = _pkce_pair()

    # Authorization request – Authentik will redirect with ?code=…
    r = await client.get(
        AUTHORIZE_URL,
        params={
            "client_id": settings.AUTHENTIK_CLIENT_ID,
            "redirect_uri": REDIRECT_URI,
            "response_type": "code",
            "scope": "openid profile email",
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        },
        follow_redirects=False,
    )
    if r.status_code not in (302, 303):
        raise HeadlessAuthError(
            f"Expected redirect from authorize, got {r.status_code}"
        )

    location = r.headers.get("location", "")
    qs = parse_qs(urlparse(location).query)
    code = (qs.get("code") or [None])[0]
    if not code:
        raise HeadlessAuthError(f"No code in redirect: {location}")

    # Token exchange (does NOT need the session cookie)
    r = await client.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": settings.AUTHENTIK_CLIENT_ID,
            "code_verifier": verifier,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    r.raise_for_status()
    return r.json()


# ── public API ────────────────────────────────────────────────────────


async def headless_login(username: str, password: str) -> dict:
    """Authenticate *username* / *password* and return OIDC tokens."""
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            await _drive_flow(client, username, password)
            return await _exchange_tokens(client)
        except httpx.HTTPStatusError as exc:
            logger.warning("Authentik HTTP error during login: %s", exc)
            raise HeadlessAuthError("Authentication failed") from exc


async def headless_register(
    username: str, email: str, password: str, name: str = ""
) -> dict:
    """Create a user in Authentik and return OIDC tokens.

    Uses the Authentik Admin API to create the user and set the password,
    then logs in via the flow executor to obtain valid tokens.
    """
    if not settings.AUTHENTIK_API_TOKEN:
        raise HeadlessAuthError(
            "Registration is not available (AUTHENTIK_API_TOKEN not configured)"
        )
    api_headers = {
        "Authorization": f"Bearer {settings.AUTHENTIK_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        # Check if user already exists
        r = await client.get(
            USERS_URL,
            params={"search": email},
            headers=api_headers,
        )
        r.raise_for_status()
        results = r.json().get("results", [])
        for u in results:
            if u.get("email", "").lower() == email.lower():
                raise HeadlessAuthError("An account with this email already exists")

        # Create user
        user_data = {
            "username": username,
            "email": email,
            "name": name or username,
            "is_active": True,
        }
        r = await client.post(USERS_URL, json=user_data, headers=api_headers)
        if r.status_code == 400:
            detail = r.json()
            if "username" in detail:
                raise HeadlessAuthError("An account with this username already exists")
            raise HeadlessAuthError(f"Registration failed: {detail}")
        r.raise_for_status()
        user_pk = r.json()["pk"]

        # Set password
        r = await client.post(
            f"{USERS_URL}{user_pk}/set_password/",
            json={"password": password},
            headers=api_headers,
        )
        r.raise_for_status()

    # Now login as the new user to get tokens
    return await headless_login(username, password)


async def headless_recovery_start(email: str) -> None:
    """Initiate password recovery for *email* via Authentik's recovery flow.

    Drives the identification stage so Authentik sends the recovery email.
    Does not raise on unknown email — to prevent email enumeration.
    """
    if not settings.AUTHENTIK_API_TOKEN:
        raise HeadlessAuthError("Recovery is not available")

    api_headers = {
        "Authorization": f"Bearer {settings.AUTHENTIK_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    # Look up the user by email to get their username/pk
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        r = await client.get(
            USERS_URL,
            params={"search": email},
            headers=api_headers,
        )
        r.raise_for_status()
        results = r.json().get("results", [])
        user = None
        for u in results:
            if u.get("email", "").lower() == email.lower():
                user = u
                break

        if not user:
            # Silently succeed to prevent email enumeration
            logger.debug("Recovery requested for unknown email: %s", email)
            return

        # Drive the recovery flow's identification stage
        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        r = await client.get(RECOVERY_FLOW_URL, headers=headers, follow_redirects=True)
        r.raise_for_status()
        data = r.json()
        logger.debug("Recovery flow GET response: %s", data)

        component = data.get("component", "")
        if component == "ak-stage-identification":
            r = await client.post(
                RECOVERY_FLOW_URL,
                json={"uid_field": email},
                headers=headers,
                follow_redirects=True,
            )
            r.raise_for_status()
            data = r.json()
            logger.debug("After identification POST: %s", data)

        component = data.get("component", "")
        if component == "ak-stage-email":
            # Authentik auto-sends the email when this stage is reached.
            # Do NOT POST to acknowledge — that triggers a duplicate send.
            logger.debug("Email stage reached; email sent automatically")
        else:
            logger.warning(
                "Expected ak-stage-email but got component=%s, full data=%s",
                component,
                data,
            )

        logger.debug("Recovery flow initiated for user: %s", email)


async def headless_recovery_complete(token: str, new_password: str) -> None:
    """Complete password recovery using the token from the recovery email.

    Looks up the token via the Authentik Admin API (list + view_key),
    identifies the owning user, and sets their password directly.
    """
    if not settings.AUTHENTIK_API_TOKEN:
        raise HeadlessAuthError("Recovery is not available")

    api_headers = {
        "Authorization": f"Bearer {settings.AUTHENTIK_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    tokens_url = f"{settings.AUTHENTIK_BASE_URL}/api/v3/core/tokens/"

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        # 1. Find the recovery token by checking each verification token's key.
        #    The list endpoint does not include the secret `key` field, so we
        #    must call view_key on each candidate.
        user_pk: int | None = None
        token_identifier: str | None = None
        page = 1
        found = False

        while not found:
            resp = await client.get(
                tokens_url,
                headers=api_headers,
                params={
                    "intent": "verification",
                    "ordering": "-expires",
                    "page_size": 50,
                    "page": page,
                },
            )
            if resp.status_code >= 400:
                raise HeadlessAuthError("Invalid or expired recovery link")

            data = resp.json()
            results = data.get("results", [])

            for t in results:
                ident = t.get("identifier", "")
                # Retrieve the actual secret key for this token
                key_resp = await client.get(
                    f"{tokens_url}{ident}/view_key/",
                    headers=api_headers,
                )
                if key_resp.status_code != 200:
                    continue
                actual_key = key_resp.json().get("key", "")
                if actual_key == token:
                    user_obj = t.get("user_obj") or {}
                    user_pk = user_obj.get("pk") or t.get("user")
                    token_identifier = ident
                    found = True
                    break

            if found or not data.get("pagination", {}).get("next"):
                break
            page += 1

        if not user_pk:
            raise HeadlessAuthError("Invalid or expired recovery link")

        # 2. Set the user's password via the dedicated set_password endpoint
        #    (PATCH on the user object stores the raw value instead of hashing)
        resp = await client.post(
            f"{USERS_URL}{user_pk}/set_password/",
            headers=api_headers,
            json={"password": new_password},
        )
        if resp.status_code >= 400:
            try:
                err_data = resp.json()
            except Exception:
                raise HeadlessAuthError("Password reset failed")
            if isinstance(err_data.get("password"), list):
                raise HeadlessAuthError(err_data["password"][0])
            raise HeadlessAuthError(err_data.get("detail", "Password reset failed"))

        # 3. Clean up the used token (best-effort)
        if token_identifier:
            try:
                await client.delete(
                    f"{tokens_url}{token_identifier}/",
                    headers=api_headers,
                )
            except Exception:
                pass

        logger.debug("Password recovery completed successfully")


async def headless_change_password(
    user_email: str, current_password: str, new_password: str
) -> None:
    """Change password for an authenticated user.

    Verifies the current password by driving the login flow, then looks up
    the Authentik user pk by email and sets the new password via the Admin API.
    """
    if not settings.AUTHENTIK_API_TOKEN:
        raise HeadlessAuthError("Password change is not available")

    # Verify current password (raises HeadlessAuthError if wrong)
    try:
        await headless_login(user_email, current_password)
    except HeadlessAuthError:
        raise HeadlessAuthError("Current password is incorrect")

    api_headers = {
        "Authorization": f"Bearer {settings.AUTHENTIK_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        # Look up the Authentik user pk by email
        r = await client.get(
            USERS_URL,
            params={"search": user_email},
            headers=api_headers,
        )
        r.raise_for_status()
        results = r.json().get("results", [])
        user_pk = None
        for u in results:
            if u.get("email", "").lower() == user_email.lower():
                user_pk = u.get("pk")
                break

        if not user_pk:
            raise HeadlessAuthError("Password change failed")

        # Set the new password via Authentik Admin API
        resp = await client.post(
            f"{USERS_URL}{user_pk}/set_password/",
            headers=api_headers,
            json={"password": new_password},
        )
        if resp.status_code >= 400:
            try:
                err_data = resp.json()
            except Exception:
                raise HeadlessAuthError("Password change failed")
            if isinstance(err_data.get("password"), list):
                raise HeadlessAuthError(err_data["password"][0])
            raise HeadlessAuthError(err_data.get("detail", "Password change failed"))

    logger.debug("Password changed successfully for user: %s", user_email)

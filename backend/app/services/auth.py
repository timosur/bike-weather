from dataclasses import dataclass

import httpx
import jwt
from jwt import PyJWKClient

from app.config import settings


class AuthenticationError(Exception):
    pass


@dataclass
class TokenClaims:
    sub: str
    email: str
    name: str
    email_verified: bool


class AuthService:
    def __init__(self, issuer_url: str, audience: str, oidc_config_url: str) -> None:
        self._issuer_url = issuer_url.rstrip("/")
        self._audience = audience
        self._oidc_config_url = oidc_config_url
        self._jwks_client: PyJWKClient | None = None

    def _get_jwks_client(self) -> PyJWKClient:
        if self._jwks_client is None:
            jwks_uri = self._discover_jwks_uri()
            self._jwks_client = PyJWKClient(jwks_uri, cache_keys=True, lifespan=3600)
        return self._jwks_client

    def _discover_jwks_uri(self) -> str:
        response = httpx.get(self._oidc_config_url, timeout=10)
        response.raise_for_status()
        config = response.json()
        jwks_uri = config.get("jwks_uri")
        if not jwks_uri:
            raise AuthenticationError("OIDC config missing jwks_uri")
        return jwks_uri

    def validate_token(self, token: str) -> TokenClaims:
        try:
            jwks_client = self._get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self._issuer_url + "/",
                audience=self._audience,
                options={"require": ["exp", "iss", "aud", "sub"]},
            )
            return TokenClaims(
                sub=payload["sub"],
                email=payload.get("email", ""),
                name=payload.get("name", ""),
                email_verified=payload.get("email_verified", False),
            )
        except jwt.ExpiredSignatureError as e:
            raise AuthenticationError("Token has expired") from e
        except jwt.InvalidIssuerError as e:
            raise AuthenticationError("Invalid token issuer") from e
        except jwt.InvalidAudienceError as e:
            raise AuthenticationError("Invalid token audience") from e
        except jwt.PyJWTError as e:
            raise AuthenticationError(f"Token validation failed: {e}") from e

    def clear_cache(self) -> None:
        self._jwks_client = None


auth_service = AuthService(
    issuer_url=settings.AUTHENTIK_ISSUER_URL,
    audience=settings.AUTHENTIK_AUDIENCE,
    oidc_config_url=settings.AUTHENTIK_OIDC_CONFIG_URL,
)

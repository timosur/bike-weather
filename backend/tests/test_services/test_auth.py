from unittest.mock import MagicMock, patch

import jwt as pyjwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import Encoding, NoEncryption, PrivateFormat, PublicFormat
from jwt import PyJWKClient

from app.services.auth import AuthService, AuthenticationError


@pytest.fixture
def auth_service_with_mock_jwks(
    rsa_key_pair: tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey],
) -> tuple[AuthService, rsa.RSAPrivateKey]:
    private_key, public_key = rsa_key_pair
    service = AuthService(
        issuer_url="http://localhost:9000/application/o/bike-weather",
        audience="bike-weather",
        oidc_config_url="http://localhost:9000/application/o/bike-weather/.well-known/openid-configuration",
    )

    # Create a mock signing key that returns the public key
    mock_signing_key = MagicMock()
    mock_signing_key.key = public_key.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo)

    mock_jwks_client = MagicMock(spec=PyJWKClient)
    mock_jwks_client.get_signing_key_from_jwt.return_value = mock_signing_key

    service._jwks_client = mock_jwks_client
    return service, private_key


def _encode_jwt(
    private_key: rsa.RSAPrivateKey,
    sub: str = "auth|123",
    email: str = "test@example.com",
    name: str = "Test User",
    issuer: str = "http://localhost:9000/application/o/bike-weather/",
    audience: str = "bike-weather",
    expired: bool = False,
) -> str:
    import datetime

    now = datetime.datetime.now(datetime.timezone.utc)
    exp = now - datetime.timedelta(hours=1) if expired else now + datetime.timedelta(hours=1)
    payload = {
        "sub": sub,
        "email": email,
        "name": name,
        "email_verified": True,
        "iss": issuer,
        "aud": audience,
        "exp": exp,
        "iat": now,
    }
    pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
    return pyjwt.encode(payload, pem, algorithm="RS256")


def test_validate_token_valid(
    auth_service_with_mock_jwks: tuple[AuthService, rsa.RSAPrivateKey],
) -> None:
    service, private_key = auth_service_with_mock_jwks
    token = _encode_jwt(private_key)
    claims = service.validate_token(token)

    assert claims.sub == "auth|123"
    assert claims.email == "test@example.com"
    assert claims.name == "Test User"
    assert claims.email_verified is True


def test_validate_token_expired_raises(
    auth_service_with_mock_jwks: tuple[AuthService, rsa.RSAPrivateKey],
) -> None:
    service, private_key = auth_service_with_mock_jwks
    token = _encode_jwt(private_key, expired=True)

    with pytest.raises(AuthenticationError, match="expired"):
        service.validate_token(token)


def test_validate_token_wrong_issuer_raises(
    auth_service_with_mock_jwks: tuple[AuthService, rsa.RSAPrivateKey],
) -> None:
    service, private_key = auth_service_with_mock_jwks
    token = _encode_jwt(private_key, issuer="http://wrong-issuer.com/")

    with pytest.raises(AuthenticationError, match="issuer"):
        service.validate_token(token)


def test_validate_token_wrong_audience_raises(
    auth_service_with_mock_jwks: tuple[AuthService, rsa.RSAPrivateKey],
) -> None:
    service, private_key = auth_service_with_mock_jwks
    token = _encode_jwt(private_key, audience="wrong-audience")

    with pytest.raises(AuthenticationError, match="audience"):
        service.validate_token(token)


def test_validate_token_invalid_signature_raises(
    auth_service_with_mock_jwks: tuple[AuthService, rsa.RSAPrivateKey],
) -> None:
    service, _ = auth_service_with_mock_jwks
    # Sign with a different key
    other_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    token = _encode_jwt(other_key)

    with pytest.raises(AuthenticationError):
        service.validate_token(token)


def test_jwks_cache_refreshes() -> None:
    service = AuthService(
        issuer_url="http://localhost:9000/application/o/bike-weather",
        audience="bike-weather",
        oidc_config_url="http://localhost:9000/application/o/bike-weather/.well-known/openid-configuration",
    )
    # Pre-set a cached client
    mock_client = MagicMock(spec=PyJWKClient)
    service._jwks_client = mock_client

    # Clear cache
    service.clear_cache()
    assert service._jwks_client is None

    # After clearing, _get_jwks_client should rediscover
    with patch.object(service, "_discover_jwks_uri", return_value="http://localhost:9000/jwks"):
        client = service._get_jwks_client()
        assert client is not None
        assert client is not mock_client

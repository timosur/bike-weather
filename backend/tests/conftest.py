from collections.abc import AsyncGenerator
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
)
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import SQLModel

from app.api.dependencies import get_current_user, get_optional_user
from app.database import get_session
from app.main import app
from app.models.user import User
from app.seed import run_seed

# Import all models so metadata is populated
from app.models import (  # noqa: F401
    AboutContent,
    AffiliateDisclosure,
    ContactMessage,
    FaqItem,
    Product,
    ProductCategory,
    SavedRoute,
    Shop,
    User,
)

SQLITE_URL = "sqlite+aiosqlite://"


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(SQLITE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
async def seeded_session(db_session: AsyncSession) -> AsyncSession:
    await run_seed(db_session)
    return db_session


@pytest.fixture
def rsa_key_pair() -> tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return private_key, private_key.public_key()


@pytest.fixture
def make_test_jwt(
    rsa_key_pair: tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey],
) -> Any:
    private_key, _ = rsa_key_pair

    def _factory(
        sub: str = "auth|123",
        email: str = "test@example.com",
        name: str = "Test User",
        email_verified: bool = True,
        issuer: str = "http://localhost:9000/application/o/bike-weather/",
        audience: str = "bike-weather",
        expired: bool = False,
    ) -> str:
        now = datetime.now(timezone.utc)
        exp = now - timedelta(hours=1) if expired else now + timedelta(hours=1)
        payload = {
            "sub": sub,
            "email": email,
            "name": name,
            "email_verified": email_verified,
            "iss": issuer,
            "aud": audience,
            "exp": exp,
            "iat": now,
        }
        pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
        return jwt.encode(payload, pem, algorithm="RS256")

    return _factory


@pytest.fixture
async def create_test_user(db_session: AsyncSession) -> User:
    user = User(
        external_id="auth|123",
        email="test@example.com",
        name="Test User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def authenticated_client(
    db_session: AsyncSession, create_test_user: User
) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    async def override_get_current_user() -> User:
        return create_test_user

    async def override_get_optional_user() -> User:
        return create_test_user

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_optional_user] = override_get_optional_user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()

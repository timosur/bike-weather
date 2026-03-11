import json

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://bike:bike@localhost:5432/bikeweather"
    AUTHENTIK_ISSUER_URL: str = ""
    AUTHENTIK_AUDIENCE: str = ""
    AUTHENTIK_BASE_URL: str = "http://localhost:9000"
    AUTHENTIK_API_TOKEN: str = ""
    AUTHENTIK_CLIENT_ID: str = "bike-weather"
    AUTHENTIK_AUTH_FLOW_SLUG: str = "default-authentication-flow"
    AUTHENTIK_RECOVERY_FLOW_SLUG: str = "default-recovery-flow"
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    DEBUG: bool = False
    TURNSTILE_SECRET_KEY: str = ""
    TURNSTILE_ENABLED: bool = True
    OTEL_EXPORTER_OTLP_ENDPOINT: str = ""
    OTEL_SERVICE_NAME: str = "bike-weather-backend"
    APP_VERSION: str = "0.0.0"
    AGENT_SERVICE_URL: str = "http://localhost:8001"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @computed_field  # type: ignore[prop-decorator]
    @property
    def AUTHENTIK_OIDC_CONFIG_URL(self) -> str:
        issuer = self.AUTHENTIK_ISSUER_URL.rstrip("/")
        return f"{issuer}/.well-known/openid-configuration" if issuer else ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> list[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, TypeError):
                pass
            # Fallback: comma-separated
            return [s.strip() for s in v.split(",") if s.strip()]
        return ["http://localhost:5173"]


settings = Settings()

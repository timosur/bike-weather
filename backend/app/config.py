import json

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://bike:bike@localhost:5432/bikeweather"
    AUTHENTIK_ISSUER_URL: str = ""
    AUTHENTIK_AUDIENCE: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

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

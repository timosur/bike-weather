from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://bike:bike@localhost:5432/bikeweather"
    AUTHENTIK_ISSUER_URL: str = ""
    AUTHENTIK_AUDIENCE: str = ""
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

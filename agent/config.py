"""Agent configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration for the product agent."""

    # LLM settings
    llm_provider: str = "openai"  # "openai" or "anthropic"
    llm_model: str = "gpt-3.5-turbo"
    llm_api_key: str = ""

    # HTTP settings
    request_timeout: float = 30.0
    request_delay: float = 2.0  # seconds between page fetches
    user_agent: str = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    )

    model_config = {
        "env_prefix": "AGENT_",
        "env_file": ".env",
        "extra": "ignore",
    }


settings = Settings()

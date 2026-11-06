from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str = ""
    supabase_service_key: str = ""

    llm_provider: str = "gemini"      # gemini | openai | ollama
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    cors_origins: list[str] = ["http://localhost:5173"]


settings = Settings()
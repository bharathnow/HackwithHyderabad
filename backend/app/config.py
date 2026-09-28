import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    PRIMARY_LLM_MODEL: str = "openai/gpt-oss-120b"
    FALLBACK_LLM_MODEL: str = "qwen/qwen3-32b"
    
    HINDSIGHT_BASE_URL: str = "http://localhost:8888"
    HINDSIGHT_API_KEY: str = ""
    HINDSIGHT_BANK_ID: str = "incidentmind-bank"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

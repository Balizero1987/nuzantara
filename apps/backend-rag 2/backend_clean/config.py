from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    anthropic_api_key: str
    chroma_db_path: str = "../data/chroma_db"
    collection_name: str = "zantara_kb"
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))  # Cloud Run sets PORT

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hunarmand API"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Postgres Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "hunarmand_db"
    POSTGRES_PORT: str = "5432"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Using asyncpg driver for asynchronous DB operations
        if self.POSTGRES_PASSWORD:
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # JWT Security
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    # S3 / Cloudflare R2 Config
    S3_BUCKET: str = "hunarmand-vault"
    S3_ENDPOINT_URL: str = "" # e.g. https://<account_id>.r2.cloudflarestorage.com
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    # AI Pipeline
    OPENAI_API_KEY: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

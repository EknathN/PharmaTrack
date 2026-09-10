from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PharmaTrack API"
    DATABASE_URL: str = "sqlite:///./pharmatrack.db"
    SECRET_KEY: str = "supersecretkey-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    NEAR_EXPIRY_THRESHOLD_DAYS: int = 60

    class Config:
        env_file = ".env"

settings = Settings()

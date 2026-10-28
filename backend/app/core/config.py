import os
from pydantic_settings import BaseSettings

def get_normalized_db_url() -> str:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    default_db_path = os.path.join(backend_dir, "examrail.db").replace("\\", "/")
    raw_url = os.getenv(
        "DATABASE_URL", 
        f"sqlite+aiosqlite:///{default_db_path}"
    )
    # Convert postgres:// or postgresql:// to postgresql+asyncpg://
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Strip any sslmode= query parameter for asyncpg
    if "postgresql+asyncpg://" in raw_url and "sslmode=" in raw_url:
        import urllib.parse
        parsed = urllib.parse.urlparse(raw_url)
        query_dict = urllib.parse.parse_qs(parsed.query)
        query_dict.pop("sslmode", None)
        new_query = urllib.parse.urlencode(query_dict, doseq=True)
        raw_url = urllib.parse.urlunparse(parsed._replace(query=new_query))
        
    return raw_url

class Settings(BaseSettings):
    PROJECT_NAME: str = "NEX Platform API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nex_super_secret_jwt_key_for_ssc_mastery_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Normalized Database URL supporting Postgres (Neon, Supabase, AWS) and SQLite
    DATABASE_URL: str = get_normalized_db_url()
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

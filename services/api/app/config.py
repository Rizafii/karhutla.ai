from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://karhutla:karhutla_local_demo@localhost:5432/karhutla"
    service_token: str = "replace-with-a-random-local-token"
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "backend", "testserver"]
    allowed_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    demo_mode: bool = True
    data_dir: Path = Path("data")
    simulation_speed: int = 1


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)

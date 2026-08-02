import os

from pydantic_settings import BaseSettings


def _default_database_url() -> str:
    # Vercel’s serverless filesystem is read-only except /tmp
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "sqlite:////tmp/ims-adaptiv.db"
    return "sqlite:///./inventory.db"


class Settings(BaseSettings):
    app_name: str = "Inventory Management System - ADAPTIV"
    secret_key: str = "adaptiv-inventory-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    database_url: str = _default_database_url()

    odoo_url: str = ""
    odoo_db: str = ""
    odoo_username: str = ""
    odoo_password: str = ""


settings = Settings()

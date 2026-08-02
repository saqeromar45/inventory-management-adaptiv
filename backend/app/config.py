from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Inventory Management System - ADAPTIV"
    secret_key: str = "adaptiv-inventory-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    database_url: str = "sqlite:///./inventory.db"

    odoo_url: str = ""
    odoo_db: str = ""
    odoo_username: str = ""
    odoo_password: str = ""


settings = Settings()

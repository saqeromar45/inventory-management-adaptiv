from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import hash_password
from .config import settings
from .database import Base, SessionLocal, engine
from .models import User, UserRole, Warehouse
from .routers import auth, import_data, inventory_counts, movements, odoo, products, reports, warehouses


def seed_data():
    db = SessionLocal()
    try:
        if not db.query(User).first():
            admin = User(
                username="admin",
                full_name="مدير النظام",
                hashed_password=hash_password("admin123"),
                role=UserRole.admin,
            )
            keeper = User(
                username="warehouse",
                full_name="أمين المخزن",
                hashed_password=hash_password("warehouse123"),
                role=UserRole.warehouse_keeper,
            )
            db.add_all([admin, keeper])

        if not db.query(Warehouse).first():
            db.add(Warehouse(code="MAIN", name="المخزن الرئيسي", location="ADAPTIV"))
            db.add(Warehouse(code="WH2", name="مخزن فرعي", location="ADAPTIV - فرع 2"))

        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_data()
    yield


app = FastAPI(
    title=settings.app_name,
    description="نظام إدارة المخزون والجرد - ADAPTIV",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(warehouses.router, prefix="/api")
app.include_router(movements.router, prefix="/api")
app.include_router(inventory_counts.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(import_data.router, prefix="/api")
app.include_router(odoo.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}

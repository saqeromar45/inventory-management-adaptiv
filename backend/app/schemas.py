from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

from .models import CountStatus, MovementType, UserRole

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    full_name: str
    password: str
    role: UserRole = UserRole.viewer


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}


# Category
class CategoryCreate(BaseModel):
    name: str
    description: str | None = None


class CategoryOut(BaseModel):
    id: int
    name: str
    description: str | None

    model_config = {"from_attributes": True}


# Warehouse
class WarehouseCreate(BaseModel):
    code: str
    name: str
    location: str | None = None


class WarehouseOut(BaseModel):
    id: int
    code: str
    name: str
    location: str | None
    is_active: bool

    model_config = {"from_attributes": True}


# Product
class ProductCreate(BaseModel):
    sku: str
    barcode: str | None = None
    name: str
    description: str | None = None
    unit: str = "قطعة"
    category_id: int | None = None
    cost_price: float = 0.0
    sale_price: float = 0.0
    min_stock: float = 0.0
    odoo_id: int | None = None


class ProductUpdate(BaseModel):
    barcode: str | None = None
    name: str | None = None
    description: str | None = None
    unit: str | None = None
    category_id: int | None = None
    cost_price: float | None = None
    sale_price: float | None = None
    min_stock: float | None = None
    is_active: bool | None = None


class ProductOut(BaseModel):
    id: int
    sku: str
    barcode: str | None
    name: str
    description: str | None
    unit: str
    category_id: int | None
    cost_price: float
    sale_price: float
    min_stock: float
    odoo_id: int | None
    is_active: bool
    total_quantity: float = 0.0

    model_config = {"from_attributes": True}


# Stock
class StockLevelOut(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    quantity: float
    product_name: str | None = None
    product_sku: str | None = None
    warehouse_name: str | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class StockMovementCreate(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: float = Field(gt=0)
    from_warehouse_id: int | None = None
    to_warehouse_id: int | None = None
    reference: str | None = None
    notes: str | None = None


class StockMovementOut(BaseModel):
    id: int
    product_id: int
    movement_type: MovementType
    quantity: float
    from_warehouse_id: int | None
    to_warehouse_id: int | None
    reference: str | None
    notes: str | None
    user_id: int
    created_at: datetime
    product_name: str | None = None
    from_warehouse_name: str | None = None
    to_warehouse_name: str | None = None

    model_config = {"from_attributes": True}


# Inventory Count
class InventoryCountCreate(BaseModel):
    name: str
    warehouse_id: int
    notes: str | None = None


class InventoryCountLineUpdate(BaseModel):
    counted_quantity: float
    notes: str | None = None


class InventoryCountLineOut(BaseModel):
    id: int
    product_id: int
    product_sku: str | None = None
    product_name: str | None = None
    system_quantity: float
    counted_quantity: float | None
    variance: float | None = None
    notes: str | None

    model_config = {"from_attributes": True}


class InventoryCountOut(BaseModel):
    id: int
    name: str
    warehouse_id: int
    warehouse_name: str | None = None
    status: CountStatus
    notes: str | None
    user_id: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    lines: list[InventoryCountLineOut] = []

    model_config = {"from_attributes": True}


# Reports
class LowStockItem(BaseModel):
    product_id: int
    sku: str
    name: str
    warehouse_id: int
    warehouse_name: str
    quantity: float
    min_stock: float
    shortage: float


class VarianceReportItem(BaseModel):
    product_id: int
    sku: str
    name: str
    system_quantity: float
    counted_quantity: float
    variance: float
    variance_value: float


class DashboardStats(BaseModel):
    total_products: int
    total_warehouses: int
    total_stock_value: float
    low_stock_count: int
    pending_counts: int
    recent_movements: int


# Import / Odoo
class ImportResult(BaseModel):
    created: int
    updated: int
    errors: list[str]


class OdooConfig(BaseModel):
    url: str
    db: str
    username: str
    password: str


class OdooSyncResult(BaseModel):
    products_synced: int
    stock_synced: int
    errors: list[str]

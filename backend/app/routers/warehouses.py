from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Product, StockLevel, User, UserRole, Warehouse
from ..schemas import StockLevelOut, WarehouseCreate, WarehouseOut

router = APIRouter(prefix="/warehouses", tags=["المخازن"])


@router.get("", response_model=list[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Warehouse).filter(Warehouse.is_active == True).all()


@router.post("", response_model=WarehouseOut)
def create_warehouse(
    body: WarehouseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    if db.query(Warehouse).filter(Warehouse.code == body.code).first():
        raise HTTPException(status_code=400, detail="رمز المخزن موجود مسبقاً")
    wh = Warehouse(**body.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/{warehouse_id}/stock", response_model=list[StockLevelOut])
def warehouse_stock(warehouse_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="المخزن غير موجود")
    levels = db.query(StockLevel).filter(StockLevel.warehouse_id == warehouse_id, StockLevel.quantity > 0).all()
    result = []
    for lv in levels:
        out = StockLevelOut.model_validate(lv)
        out.product_name = lv.product.name
        out.product_sku = lv.product.sku
        out.warehouse_name = wh.name
        result.append(out)
    return result


@router.get("/stock/all", response_model=list[StockLevelOut])
def all_stock(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    levels = db.query(StockLevel).filter(StockLevel.quantity > 0).all()
    result = []
    for lv in levels:
        out = StockLevelOut.model_validate(lv)
        out.product_name = lv.product.name
        out.product_sku = lv.product.sku
        out.warehouse_name = lv.warehouse.name
        result.append(out)
    return result

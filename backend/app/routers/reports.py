from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import CountStatus, InventoryCount, Product, StockLevel, StockMovement, User, Warehouse
from ..schemas import DashboardStats, LowStockItem, StockMovementOut, VarianceReportItem

router = APIRouter(prefix="/reports", tags=["التقارير"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_products = db.query(Product).filter(Product.is_active == True).count()
    total_warehouses = db.query(Warehouse).filter(Warehouse.is_active == True).count()

    levels = db.query(StockLevel).all()
    total_stock_value = sum(
        lv.quantity * (lv.product.cost_price or 0) for lv in levels
    )

    low_stock_count = 0
    for lv in levels:
        if lv.quantity < lv.product.min_stock:
            low_stock_count += 1

    pending_counts = db.query(InventoryCount).filter(
        InventoryCount.status.in_([CountStatus.draft, CountStatus.in_progress])
    ).count()

    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_movements = db.query(StockMovement).filter(StockMovement.created_at >= week_ago).count()

    return DashboardStats(
        total_products=total_products,
        total_warehouses=total_warehouses,
        total_stock_value=round(total_stock_value, 2),
        low_stock_count=low_stock_count,
        pending_counts=pending_counts,
        recent_movements=recent_movements,
    )


@router.get("/low-stock", response_model=list[LowStockItem])
def low_stock(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    levels = db.query(StockLevel).all()
    items = []
    for lv in levels:
        if lv.quantity < lv.product.min_stock:
            items.append(LowStockItem(
                product_id=lv.product_id,
                sku=lv.product.sku,
                name=lv.product.name,
                warehouse_id=lv.warehouse_id,
                warehouse_name=lv.warehouse.name,
                quantity=lv.quantity,
                min_stock=lv.product.min_stock,
                shortage=lv.product.min_stock - lv.quantity,
            ))
    return sorted(items, key=lambda x: x.shortage, reverse=True)


@router.get("/variance/{count_id}", response_model=list[VarianceReportItem])
def variance_report(count_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    count = db.query(InventoryCount).filter(InventoryCount.id == count_id).first()
    if not count:
        return []

    items = []
    for line in count.lines:
        if line.counted_quantity is None:
            continue
        variance = line.counted_quantity - line.system_quantity
        if variance != 0:
            items.append(VarianceReportItem(
                product_id=line.product_id,
                sku=line.product.sku,
                name=line.product.name,
                system_quantity=line.system_quantity,
                counted_quantity=line.counted_quantity,
                variance=variance,
                variance_value=variance * line.product.cost_price,
            ))
    return sorted(items, key=lambda x: abs(x.variance), reverse=True)


@router.get("/movements/recent", response_model=list[StockMovementOut])
def recent_movements(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    movements = db.query(StockMovement).order_by(StockMovement.created_at.desc()).limit(20).all()
    result = []
    for m in movements:
        out = StockMovementOut.model_validate(m)
        out.product_name = m.product.name
        out.from_warehouse_name = m.from_warehouse.name if m.from_warehouse else None
        out.to_warehouse_name = m.to_warehouse.name if m.to_warehouse else None
        result.append(out)
    return result

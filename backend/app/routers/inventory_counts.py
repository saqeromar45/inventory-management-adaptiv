from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import (
    CountStatus,
    InventoryCount,
    InventoryCountLine,
    MovementType,
    Product,
    StockLevel,
    StockMovement,
    User,
    UserRole,
)
from ..schemas import (
    InventoryCountCreate,
    InventoryCountLineOut,
    InventoryCountLineUpdate,
    InventoryCountOut,
)
from ..services.stock import apply_movement

router = APIRouter(prefix="/inventory-counts", tags=["الجرد"])


def _count_to_out(count: InventoryCount) -> InventoryCountOut:
    out = InventoryCountOut.model_validate(count)
    out.warehouse_name = count.warehouse.name
    out.lines = []
    for line in count.lines:
        lo = InventoryCountLineOut.model_validate(line)
        lo.product_sku = line.product.sku
        lo.product_name = line.product.name
        lo.variance = line.variance
        out.lines.append(lo)
    return out


@router.get("", response_model=list[InventoryCountOut])
def list_counts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    counts = db.query(InventoryCount).order_by(InventoryCount.created_at.desc()).all()
    return [_count_to_out(c) for c in counts]


@router.post("", response_model=InventoryCountOut)
def create_count(
    body: InventoryCountCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    count = InventoryCount(**body.model_dump(), user_id=user.id, status=CountStatus.draft)
    db.add(count)
    db.flush()

    stock_levels = db.query(StockLevel).filter(StockLevel.warehouse_id == body.warehouse_id).all()

    all_products = db.query(Product).filter(Product.is_active == True).all()
    for product in all_products:
        level = next((sl for sl in stock_levels if sl.product_id == product.id), None)
        system_qty = level.quantity if level else 0.0
        line = InventoryCountLine(
            count_id=count.id,
            product_id=product.id,
            system_quantity=system_qty,
        )
        db.add(line)

    db.commit()
    db.refresh(count)
    return _count_to_out(count)


@router.get("/{count_id}", response_model=InventoryCountOut)
def get_count(count_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    count = db.query(InventoryCount).filter(InventoryCount.id == count_id).first()
    if not count:
        raise HTTPException(status_code=404, detail="عملية الجرد غير موجودة")
    return _count_to_out(count)


@router.post("/{count_id}/start", response_model=InventoryCountOut)
def start_count(
    count_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    count = db.query(InventoryCount).filter(InventoryCount.id == count_id).first()
    if not count:
        raise HTTPException(status_code=404, detail="عملية الجرد غير موجودة")
    if count.status not in (CountStatus.draft, CountStatus.in_progress):
        raise HTTPException(status_code=400, detail="لا يمكن بدء هذه العملية")

    count.status = CountStatus.in_progress
    count.started_at = datetime.utcnow()
    db.commit()
    db.refresh(count)
    return _count_to_out(count)


@router.put("/{count_id}/lines/{line_id}", response_model=InventoryCountLineOut)
def update_count_line(
    count_id: int,
    line_id: int,
    body: InventoryCountLineUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    count = db.query(InventoryCount).filter(InventoryCount.id == count_id).first()
    if not count or count.status not in (CountStatus.draft, CountStatus.in_progress):
        raise HTTPException(status_code=400, detail="عملية الجرد غير قابلة للتعديل")

    line = db.query(InventoryCountLine).filter(
        InventoryCountLine.id == line_id,
        InventoryCountLine.count_id == count_id,
    ).first()
    if not line:
        raise HTTPException(status_code=404, detail="سطر الجرد غير موجود")

    line.counted_quantity = body.counted_quantity
    line.notes = body.notes
    if count.status == CountStatus.draft:
        count.status = CountStatus.in_progress
        count.started_at = datetime.utcnow()

    db.commit()
    db.refresh(line)

    out = InventoryCountLineOut.model_validate(line)
    out.product_sku = line.product.sku
    out.product_name = line.product.name
    out.variance = line.variance
    return out


@router.post("/{count_id}/complete", response_model=InventoryCountOut)
def complete_count(
    count_id: int,
    apply_adjustments: bool = True,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    count = db.query(InventoryCount).filter(InventoryCount.id == count_id).first()
    if not count:
        raise HTTPException(status_code=404, detail="عملية الجرد غير موجودة")
    if count.status == CountStatus.completed:
        raise HTTPException(status_code=400, detail="تم إكمال الجرد مسبقاً")

    uncounted = [l for l in count.lines if l.counted_quantity is None]
    if uncounted:
        raise HTTPException(
            status_code=400,
            detail=f"يوجد {len(uncounted)} منتج لم يتم جرده بعد",
        )

    if apply_adjustments:
        for line in count.lines:
            variance = line.counted_quantity - line.system_quantity
            if variance != 0:
                movement = StockMovement(
                    product_id=line.product_id,
                    movement_type=MovementType.adjustment,
                    quantity=line.counted_quantity,
                    to_warehouse_id=count.warehouse_id,
                    reference=f"جرد #{count.id}",
                    notes=f"تعديل جرد: نظام={line.system_quantity}, فعلي={line.counted_quantity}",
                    user_id=user.id,
                )
                apply_movement(db, movement)
                db.add(movement)

    count.status = CountStatus.completed
    count.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(count)
    return _count_to_out(count)

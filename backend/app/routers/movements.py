from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Product, StockMovement, User, UserRole
from ..schemas import PaginatedResponse, StockMovementCreate, StockMovementOut
from ..services.stock import apply_movement

router = APIRouter(prefix="/movements", tags=["حركات المخزون"])


@router.get("", response_model=PaginatedResponse[StockMovementOut])
def list_movements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(StockMovement).order_by(StockMovement.created_at.desc())
    total = q.count()
    movements = q.offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for m in movements:
        out = StockMovementOut.model_validate(m)
        out.product_name = m.product.name
        out.from_warehouse_name = m.from_warehouse.name if m.from_warehouse else None
        out.to_warehouse_name = m.to_warehouse.name if m.to_warehouse else None
        items.append(out)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=StockMovementOut)
def create_movement(
    body: StockMovementCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")

    movement = StockMovement(**body.model_dump(), user_id=user.id)
    try:
        apply_movement(db, movement)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    db.add(movement)
    db.commit()
    db.refresh(movement)

    out = StockMovementOut.model_validate(movement)
    out.product_name = product.name
    out.from_warehouse_name = movement.from_warehouse.name if movement.from_warehouse else None
    out.to_warehouse_name = movement.to_warehouse.name if movement.to_warehouse else None
    return out

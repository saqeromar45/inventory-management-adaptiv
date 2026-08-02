from sqlalchemy.orm import Session

from ..models import MovementType, StockLevel, StockMovement


def get_or_create_stock_level(db: Session, product_id: int, warehouse_id: int) -> StockLevel:
    level = (
        db.query(StockLevel)
        .filter(StockLevel.product_id == product_id, StockLevel.warehouse_id == warehouse_id)
        .first()
    )
    if not level:
        level = StockLevel(product_id=product_id, warehouse_id=warehouse_id, quantity=0.0)
        db.add(level)
        db.flush()
    return level


def apply_movement(db: Session, movement: StockMovement) -> None:
    if movement.movement_type == MovementType.in_:
        if not movement.to_warehouse_id:
            raise ValueError("يجب تحديد المخزن المستهدف للإدخال")
        level = get_or_create_stock_level(db, movement.product_id, movement.to_warehouse_id)
        level.quantity += movement.quantity

    elif movement.movement_type == MovementType.out:
        if not movement.from_warehouse_id:
            raise ValueError("يجب تحديد المخزن المصدر للإخراج")
        level = get_or_create_stock_level(db, movement.product_id, movement.from_warehouse_id)
        if level.quantity < movement.quantity:
            raise ValueError(f"الكمية غير كافية. المتاح: {level.quantity}")
        level.quantity -= movement.quantity

    elif movement.movement_type == MovementType.transfer:
        if not movement.from_warehouse_id or not movement.to_warehouse_id:
            raise ValueError("يجب تحديد المخزن المصدر والمستهدف للتحويل")
        from_level = get_or_create_stock_level(db, movement.product_id, movement.from_warehouse_id)
        if from_level.quantity < movement.quantity:
            raise ValueError(f"الكمية غير كافية. المتاح: {from_level.quantity}")
        from_level.quantity -= movement.quantity
        to_level = get_or_create_stock_level(db, movement.product_id, movement.to_warehouse_id)
        to_level.quantity += movement.quantity

    elif movement.movement_type == MovementType.adjustment:
        warehouse_id = movement.to_warehouse_id or movement.from_warehouse_id
        if not warehouse_id:
            raise ValueError("يجب تحديد المخزن للتعديل")
        level = get_or_create_stock_level(db, movement.product_id, warehouse_id)
        level.quantity = movement.quantity


def get_product_total_quantity(db: Session, product_id: int) -> float:
    levels = db.query(StockLevel).filter(StockLevel.product_id == product_id).all()
    return sum(l.quantity for l in levels)

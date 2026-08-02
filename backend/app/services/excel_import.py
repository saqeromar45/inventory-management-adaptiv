import io
from typing import Any

import pandas as pd
from sqlalchemy.orm import Session

from ..models import Category, Product, StockLevel, Warehouse


COLUMN_MAP = {
    "sku": ["sku", "كود", "رمز", "code", "product_code", "default_code"],
    "barcode": ["barcode", "باركود", "bar_code"],
    "name": ["name", "اسم", "product_name", "product", "اسم المنتج"],
    "description": ["description", "وصف", "desc"],
    "unit": ["unit", "وحدة", "uom", "unit_of_measure"],
    "category": ["category", "تصنيف", "categ", "category_name"],
    "cost_price": ["cost_price", "cost", "سعر التكلفة", "standard_price"],
    "sale_price": ["sale_price", "sale", "سعر البيع", "list_price", "price"],
    "min_stock": ["min_stock", "minimum", "حد أدنى", "reorder_min"],
    "warehouse": ["warehouse", "مخزن", "warehouse_name", "location"],
    "quantity": ["quantity", "qty", "كمية", "stock", "on_hand", "quantity_on_hand"],
}


def _find_column(df: pd.DataFrame, keys: list[str]) -> str | None:
    cols_lower = {c.lower().strip(): c for c in df.columns}
    for key in keys:
        if key.lower() in cols_lower:
            return cols_lower[key.lower()]
    return None


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        if pd.isna(val):
            return default
        return float(val)
    except (ValueError, TypeError):
        return default


def import_products_from_excel(db: Session, file_bytes: bytes) -> dict:
    try:
        if file_bytes[:4] == b"PK\x03\x04":
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception:
        df = pd.read_excel(io.BytesIO(file_bytes))

    col_map: dict[str, str | None] = {k: _find_column(df, v) for k, v in COLUMN_MAP.items()}

    if not col_map["sku"] and not col_map["name"]:
        return {"created": 0, "updated": 0, "errors": ["لم يتم العثور على أعمدة SKU أو اسم المنتج"]}

    created = updated = 0
    errors: list[str] = []

    default_warehouse = db.query(Warehouse).filter(Warehouse.is_active == True).first()

    for idx, row in df.iterrows():
        try:
            sku_val = str(row[col_map["sku"]]).strip() if col_map["sku"] else ""
            name_val = str(row[col_map["name"]]).strip() if col_map["name"] else sku_val
            if not sku_val and not name_val:
                continue
            if not sku_val:
                sku_val = name_val[:50]

            category_id = None
            if col_map["category"] and not pd.isna(row[col_map["category"]]):
                cat_name = str(row[col_map["category"]]).strip()
                cat = db.query(Category).filter(Category.name == cat_name).first()
                if not cat:
                    cat = Category(name=cat_name)
                    db.add(cat)
                    db.flush()
                category_id = cat.id

            product = db.query(Product).filter(Product.sku == sku_val).first()
            data = {
                "name": name_val,
                "barcode": str(row[col_map["barcode"]]).strip() if col_map["barcode"] and not pd.isna(row.get(col_map["barcode"])) else None,
                "description": str(row[col_map["description"]]).strip() if col_map["description"] and not pd.isna(row.get(col_map["description"])) else None,
                "unit": str(row[col_map["unit"]]).strip() if col_map["unit"] and not pd.isna(row.get(col_map["unit"])) else "قطعة",
                "category_id": category_id,
                "cost_price": _safe_float(row[col_map["cost_price"]]) if col_map["cost_price"] else 0.0,
                "sale_price": _safe_float(row[col_map["sale_price"]]) if col_map["sale_price"] else 0.0,
                "min_stock": _safe_float(row[col_map["min_stock"]]) if col_map["min_stock"] else 0.0,
            }

            if product:
                for k, v in data.items():
                    setattr(product, k, v)
                updated += 1
            else:
                product = Product(sku=sku_val, **data)
                db.add(product)
                db.flush()
                created += 1

            if col_map["quantity"] and default_warehouse:
                qty = _safe_float(row[col_map["quantity"]])
                if qty > 0:
                    wh_id = default_warehouse.id
                    if col_map["warehouse"] and not pd.isna(row.get(col_map["warehouse"])):
                        wh_name = str(row[col_map["warehouse"]]).strip()
                        wh = db.query(Warehouse).filter(Warehouse.name == wh_name).first()
                        if wh:
                            wh_id = wh.id
                    level = db.query(StockLevel).filter(
                        StockLevel.product_id == product.id,
                        StockLevel.warehouse_id == wh_id,
                    ).first()
                    if level:
                        level.quantity = qty
                    else:
                        db.add(StockLevel(product_id=product.id, warehouse_id=wh_id, quantity=qty))

        except Exception as e:
            errors.append(f"صف {idx + 2}: {str(e)}")

    db.commit()
    return {"created": created, "updated": updated, "errors": errors}

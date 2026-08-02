import xmlrpc.client

from sqlalchemy.orm import Session

from ..models import Category, Product, StockLevel, Warehouse


def sync_from_odoo(db: Session, url: str, odoo_db: str, username: str, password: str) -> dict:
    errors: list[str] = []
    products_synced = stock_synced = 0

    try:
        common = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
        uid = common.authenticate(odoo_db, username, password, {})
        if not uid:
            return {"products_synced": 0, "stock_synced": 0, "errors": ["فشل تسجيل الدخول إلى Odoo"]}

        models = xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/object")

        odoo_products = models.execute_kw(
            odoo_db, uid, password,
            "product.product", "search_read",
            [[["type", "=", "product"]]],
            {"fields": ["id", "default_code", "name", "barcode", "standard_price", "list_price", "categ_id", "uom_id", "qty_available"]},
        )

        default_warehouse = db.query(Warehouse).filter(Warehouse.is_active == True).first()
        if not default_warehouse:
            default_warehouse = Warehouse(code="MAIN", name="المخزن الرئيسي", location="Odoo Sync")
            db.add(default_warehouse)
            db.flush()

        for op in odoo_products:
            try:
                sku = op.get("default_code") or f"ODOO-{op['id']}"
                product = db.query(Product).filter(
                    (Product.odoo_id == op["id"]) | (Product.sku == sku)
                ).first()

                category_id = None
                if op.get("categ_id"):
                    cat_name = op["categ_id"][1] if isinstance(op["categ_id"], list) else str(op["categ_id"])
                    cat = db.query(Category).filter(Category.name == cat_name).first()
                    if not cat:
                        cat = Category(name=cat_name)
                        db.add(cat)
                        db.flush()
                    category_id = cat.id

                unit = "قطعة"
                if op.get("uom_id") and isinstance(op["uom_id"], list):
                    unit = op["uom_id"][1]

                data = {
                    "sku": sku,
                    "name": op["name"],
                    "barcode": op.get("barcode") or None,
                    "cost_price": float(op.get("standard_price") or 0),
                    "sale_price": float(op.get("list_price") or 0),
                    "category_id": category_id,
                    "unit": unit,
                    "odoo_id": op["id"],
                }

                if product:
                    for k, v in data.items():
                        setattr(product, k, v)
                else:
                    product = Product(**data)
                    db.add(product)
                    db.flush()

                products_synced += 1

                qty = float(op.get("qty_available") or 0)
                level = db.query(StockLevel).filter(
                    StockLevel.product_id == product.id,
                    StockLevel.warehouse_id == default_warehouse.id,
                ).first()
                if level:
                    level.quantity = qty
                else:
                    db.add(StockLevel(product_id=product.id, warehouse_id=default_warehouse.id, quantity=qty))
                stock_synced += 1

            except Exception as e:
                errors.append(f"منتج {op.get('name', op['id'])}: {str(e)}")

        db.commit()

    except Exception as e:
        errors.append(f"خطأ في الاتصال بـ Odoo: {str(e)}")

    return {"products_synced": products_synced, "stock_synced": stock_synced, "errors": errors}

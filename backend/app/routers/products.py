from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_roles
from ..database import get_db
from ..models import Category, Product, User, UserRole
from ..schemas import CategoryCreate, CategoryOut, PaginatedResponse, ProductCreate, ProductOut, ProductUpdate
from ..services.stock import get_product_total_quantity

router = APIRouter(prefix="/products", tags=["المنتجات"])


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Category).all()


@router.post("/categories", response_model=CategoryOut)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    cat = Category(**body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("", response_model=PaginatedResponse[ProductOut])
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Product).filter(Product.is_active == True)
    if search:
        q = q.filter(
            (Product.name.ilike(f"%{search}%"))
            | (Product.sku.ilike(f"%{search}%"))
            | (Product.barcode.ilike(f"%{search}%"))
        )
    total = q.count()
    products = q.offset((page - 1) * page_size).limit(page_size).all()
    items = []
    for p in products:
        out = ProductOut.model_validate(p)
        out.total_quantity = get_product_total_quantity(db, p.id)
        items.append(out)
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ProductOut)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    if db.query(Product).filter(Product.sku == body.sku).first():
        raise HTTPException(status_code=400, detail="رمز المنتج موجود مسبقاً")
    product = Product(**body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    out = ProductOut.model_validate(product)
    out.total_quantity = 0
    return out


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    out = ProductOut.model_validate(product)
    out.total_quantity = get_product_total_quantity(db, product.id)
    return out


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    out = ProductOut.model_validate(product)
    out.total_quantity = get_product_total_quantity(db, product.id)
    return out

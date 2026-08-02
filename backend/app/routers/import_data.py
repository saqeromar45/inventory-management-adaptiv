from fastapi import APIRouter, Depends, File, UploadFile

from ..auth import require_roles
from ..database import get_db
from ..models import User, UserRole
from ..schemas import ImportResult
from ..services.excel_import import import_products_from_excel
from sqlalchemy.orm import Session

router = APIRouter(prefix="/import", tags=["استيراد البيانات"])


@router.post("/excel", response_model=ImportResult)
async def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin, UserRole.warehouse_keeper)),
):
    content = await file.read()
    result = import_products_from_excel(db, content)
    return ImportResult(**result)

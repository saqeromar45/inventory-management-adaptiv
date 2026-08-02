from fastapi import APIRouter, Depends

from ..auth import require_roles
from ..database import get_db
from ..models import User, UserRole
from ..schemas import OdooConfig, OdooSyncResult
from ..services.odoo_sync import sync_from_odoo
from sqlalchemy.orm import Session

router = APIRouter(prefix="/odoo", tags=["Odoo"])


@router.post("/sync", response_model=OdooSyncResult)
def sync_odoo(
    config: OdooConfig,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
):
    result = sync_from_odoo(db, config.url, config.db, config.username, config.password)
    return OdooSyncResult(**result)

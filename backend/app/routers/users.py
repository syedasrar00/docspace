from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import User
from app.schemas.auth import UserRead

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return db.scalars(select(User).order_by(User.name.asc())).all()

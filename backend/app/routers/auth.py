from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import create_access_token, get_current_user
from app.models import User
from app.schemas.auth import DemoLoginRequest, TokenResponse, UserRead

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/demo-login", response_model=TokenResponse)
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This email is not one of the seeded DocSpace demo accounts.",
        )

    return TokenResponse(
        access_token=create_access_token(user),
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

from pydantic import BaseModel, field_validator

from app.schemas.common import ORMModel


class DemoLoginRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized or "@" not in normalized or len(normalized) > 150:
            raise ValueError("Enter a valid demo account email address.")
        return normalized


class UserRead(ORMModel):
    id: int
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead

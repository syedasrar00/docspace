from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.auth import UserRead


Permission = Literal["owner", "editor", "viewer"]


class TipTapDocument(BaseModel):
    """A deliberately flexible TipTap JSON document with basic shape checks."""

    model_config = ConfigDict(extra="allow")

    type: Literal["doc"]
    content: list[dict] = Field(default_factory=list)

    @field_validator("content")
    @classmethod
    def validate_content_nodes(cls, nodes: list[dict]) -> list[dict]:
        if len(nodes) > 10_000:
            raise ValueError("The document contains too many content nodes.")
        for node in nodes:
            if not isinstance(node, dict) or not isinstance(node.get("type"), str):
                raise ValueError("Each TipTap content node must have a string type.")
        return nodes


class DocumentCreate(BaseModel):
    title: str = Field(default="Untitled document", min_length=1, max_length=255)
    content: TipTapDocument = Field(
        default_factory=lambda: TipTapDocument(type="doc", content=[{"type": "paragraph"}])
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Document title cannot be empty.")
        return value


class DocumentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=255)
    content: TipTapDocument | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Document title cannot be empty.")
        return value

    @model_validator(mode="after")
    def require_an_update(self):
        if not self.model_fields_set:
            raise ValueError("Provide a title or content field to update.")
        if all(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Provide a non-null title or content field to update.")
        return self


class DocumentSummary(BaseModel):
    id: str
    title: str
    owner_id: int
    owner: UserRead
    permission: Permission
    is_owner: bool
    updated_at: datetime


class DocumentRead(DocumentSummary):
    content: dict
    created_at: datetime


class ShareCreate(BaseModel):
    user_id: int = Field(gt=0)
    permission: Literal["viewer", "editor"] = "viewer"


class ShareRead(BaseModel):
    id: int
    document_id: str
    user_id: int
    permission: Literal["viewer", "editor"]
    user: UserRead
    created_at: datetime

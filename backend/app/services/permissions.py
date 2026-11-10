from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Document, DocumentShare, User

AccessPermission = Literal["owner", "editor", "viewer"]


@dataclass(frozen=True)
class DocumentAccess:
    document: Document
    permission: AccessPermission

    @property
    def is_owner(self) -> bool:
        return self.permission == "owner"

    @property
    def can_edit(self) -> bool:
        return self.permission in ("owner", "editor")


def get_document_access(db: Session, document_id: str, current_user: User) -> DocumentAccess:
    """Return access details or 404 to avoid exposing private document IDs."""
    document = db.scalar(
        select(Document)
        .options(joinedload(Document.owner))
        .where(Document.id == document_id)
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if document.owner_id == current_user.id:
        return DocumentAccess(document=document, permission="owner")

    share = db.scalar(
        select(DocumentShare).where(
            DocumentShare.document_id == document_id,
            DocumentShare.user_id == current_user.id,
        )
    )
    if share is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    return DocumentAccess(document=document, permission=share.permission)  # type: ignore[arg-type]


def require_editor(access: DocumentAccess) -> None:
    if not access.can_edit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have view-only access to this document.",
        )


def require_owner(access: DocumentAccess) -> None:
    if not access.is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can manage sharing or delete this document.",
        )

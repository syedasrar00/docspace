from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Document, DocumentShare, User
from app.schemas.document import DocumentCreate, DocumentRead, DocumentSummary, DocumentUpdate
from app.services.permissions import get_document_access, require_editor, require_owner

router = APIRouter(prefix="/api/documents", tags=["Documents"])


def _document_response(document: Document, permission: str) -> dict:
    return {
        "id": document.id,
        "title": document.title,
        "content": document.content,
        "owner_id": document.owner_id,
        "owner": document.owner,
        "permission": permission,
        "is_owner": permission == "owner",
        "created_at": document.created_at,
        "updated_at": document.updated_at,
    }


@router.get("", response_model=list[DocumentSummary])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.execute(
        select(Document, DocumentShare.permission)
        .options(joinedload(Document.owner))
        .outerjoin(
            DocumentShare,
            (DocumentShare.document_id == Document.id)
            & (DocumentShare.user_id == current_user.id),
        )
        .where(or_(Document.owner_id == current_user.id, DocumentShare.user_id == current_user.id))
        .order_by(Document.updated_at.desc())
    ).all()

    results = []
    for document, shared_permission in rows:
        permission = "owner" if document.owner_id == current_user.id else shared_permission
        results.append(
            {
                "id": document.id,
                "title": document.title,
                "owner_id": document.owner_id,
                "owner": document.owner,
                "permission": permission,
                "is_owner": permission == "owner",
                "updated_at": document.updated_at,
            }
        )
    return results


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = Document(
        title=payload.title,
        content=payload.content.model_dump(exclude_none=True),
        owner_id=current_user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    document.owner = current_user
    return _document_response(document, "owner")


@router.get("/{document_id}", response_model=DocumentRead)
def read_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = get_document_access(db, document_id, current_user)
    return _document_response(access.document, access.permission)


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document(
    document_id: str,
    payload: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = get_document_access(db, document_id, current_user)
    require_editor(access)

    document = access.document
    changed = False
    if "title" in payload.model_fields_set and payload.title is not None:
        document.title = payload.title
        changed = True
    if "content" in payload.model_fields_set and payload.content is not None:
        document.content = payload.content.model_dump(exclude_none=True)
        changed = True
    if not changed:
        raise HTTPException(status_code=422, detail="Provide a title or content field to update.")

    document.updated_at = datetime.now(timezone.utc)
    db.add(document)
    db.commit()
    db.refresh(document)
    return _document_response(document, access.permission)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = get_document_access(db, document_id, current_user)
    require_owner(access)
    db.delete(access.document)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

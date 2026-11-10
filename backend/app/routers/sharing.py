from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import DocumentShare, User
from app.schemas.document import ShareCreate, ShareRead
from app.services.permissions import get_document_access, require_owner

router = APIRouter(prefix="/api/documents", tags=["Document sharing"])


@router.get("/{document_id}/shares", response_model=list[ShareRead])
def list_document_shares(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = get_document_access(db, document_id, current_user)
    require_owner(access)
    return db.scalars(
        select(DocumentShare)
        .options(joinedload(DocumentShare.user))
        .where(DocumentShare.document_id == document_id)
        .order_by(DocumentShare.created_at.asc())
    ).all()


@router.post("/{document_id}/shares", response_model=ShareRead, status_code=status.HTTP_200_OK)
def create_or_update_share(
    document_id: str,
    payload: ShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = get_document_access(db, document_id, current_user)
    require_owner(access)

    target_user = db.get(User, payload.user_id)
    if target_user is None:
        raise HTTPException(status_code=404, detail="The selected user does not exist.")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You already own this document.")

    share = db.scalar(
        select(DocumentShare).where(
            DocumentShare.document_id == document_id,
            DocumentShare.user_id == target_user.id,
        )
    )
    if share is None:
        share = DocumentShare(
            document_id=document_id,
            user_id=target_user.id,
            permission=payload.permission,
        )
        db.add(share)
    else:
        # Re-sharing updates the existing permission instead of creating a duplicate.
        share.permission = payload.permission

    db.commit()
    db.refresh(share)
    share.user = target_user
    return share


@router.delete("/{document_id}/shares/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_document_share(
    document_id: str,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    access = get_document_access(db, document_id, current_user)
    require_owner(access)

    share = db.scalar(
        select(DocumentShare).where(
            DocumentShare.document_id == document_id,
            DocumentShare.user_id == user_id,
        )
    )
    if share is None:
        raise HTTPException(status_code=404, detail="Sharing record not found.")

    db.delete(share)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

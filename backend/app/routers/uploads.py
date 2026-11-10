from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import MAX_UPLOAD_SIZE_BYTES
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models import Document, User
from app.schemas.document import DocumentRead
from app.routers.documents import _document_response
from app.services.markdown_converter import markdown_to_tiptap, text_to_tiptap

router = APIRouter(prefix="/api/documents", tags=["File import"])


@router.post("/import", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def import_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = (file.filename or "").replace("\\", "/").split("/")[-1].strip()
    extension = Path(filename).suffix.lower()
    if extension not in {".txt", ".md"}:
        raise HTTPException(status_code=415, detail="Only .txt and .md files are supported.")

    raw_content = await file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if len(raw_content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="The maximum supported file size is 1 MB.")
    if not raw_content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        decoded = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="The file must use UTF-8 text encoding.")
    if "\x00" in decoded:
        raise HTTPException(status_code=400, detail="The uploaded file does not appear to be a text document.")

    content = markdown_to_tiptap(decoded) if extension == ".md" else text_to_tiptap(decoded)
    title = Path(filename).stem.strip()[:255] or "Imported document"
    document = Document(title=title, content=content, owner_id=current_user.id)
    db.add(document)
    db.commit()
    db.refresh(document)
    document.owner = current_user
    return _document_response(document, "owner")

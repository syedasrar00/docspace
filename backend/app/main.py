from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import FRONTEND_ORIGIN
from app.database import Base, SessionLocal, engine
from app.models import User
from app.routers import auth, documents, sharing, uploads, users


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        seed_users = (
            ("Alice", "alice@docspace.demo"),
            ("Bob", "bob@docspace.demo"),
        )
        for name, email in seed_users:
            existing = db.scalar(select(User).where(User.email == email))
            if existing is None:
                db.add(User(name=name, email=email))
        db.commit()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="DocSpace API",
    description="A lightweight collaborative document editor API.",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [origin.strip() for origin in FRONTEND_ORIGIN.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(sharing.router)
app.include_router(uploads.router)


@app.get("/health", tags=["Infrastructure"])
def health_check():
    return {"status": "ok", "service": "docspace-api"}

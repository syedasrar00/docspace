from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

import app.main as main_module
from app.database import Base, get_db
from app.models import User
from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    database_path = tmp_path / "test_docspace.db"
    test_engine = create_engine(
        f"sqlite:///{database_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(test_engine, "connect")
    def enable_foreign_keys(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(
        bind=test_engine,
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
    )
    Base.metadata.create_all(bind=test_engine)

    with TestingSessionLocal() as db:
        db.add_all([
            User(name="Alice", email="alice@docspace.demo"),
            User(name="Bob", email="bob@docspace.demo"),
        ])
        db.commit()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(main_module, "initialize_database", lambda: None)

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture
def alice_token(client):
    response = client.post(
        "/api/auth/demo-login",
        json={"email": "alice@docspace.demo"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def bob_token(client):
    response = client.post(
        "/api/auth/demo-login",
        json={"email": "bob@docspace.demo"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
def alice_headers(alice_token):
    return {"Authorization": f"Bearer {alice_token}"}


@pytest.fixture
def bob_headers(bob_token):
    return {"Authorization": f"Bearer {bob_token}"}

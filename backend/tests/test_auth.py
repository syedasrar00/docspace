def test_demo_login_returns_bearer_token_and_user(client):
    response = client.post(
        "/api/auth/demo-login",
        json={"email": "ALICE@DOCSPACE.DEMO"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["user"] == {
        "id": 1,
        "name": "Alice",
        "email": "alice@docspace.demo",
    }


def test_unknown_demo_user_cannot_login(client):
    response = client.post(
        "/api/auth/demo-login",
        json={"email": "someone@example.com"},
    )
    assert response.status_code == 401


def test_me_requires_valid_token(client, alice_headers):
    response = client.get("/api/auth/me", headers=alice_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "alice@docspace.demo"

    missing_token = client.get("/api/auth/me")
    assert missing_token.status_code == 401

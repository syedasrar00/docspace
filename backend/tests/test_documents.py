EMPTY_DOC = {"type": "doc", "content": [{"type": "paragraph"}]}


def create_document(client, headers, title="Project Proposal"):
    response = client.post(
        "/api/documents",
        headers=headers,
        json={"title": title, "content": EMPTY_DOC},
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_list_and_read_document(client, alice_headers):
    created = create_document(client, alice_headers)
    assert created["title"] == "Project Proposal"
    assert created["permission"] == "owner"
    assert created["is_owner"] is True
    assert created["owner"]["email"] == "alice@docspace.demo"
    assert created["content"]["type"] == "doc"

    listed = client.get("/api/documents", headers=alice_headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == created["id"]

    reopened = client.get(f"/api/documents/{created['id']}", headers=alice_headers)
    assert reopened.status_code == 200
    assert reopened.json()["content"] == EMPTY_DOC


def test_document_is_private_until_shared(client, alice_headers, bob_headers):
    created = create_document(client, alice_headers)

    response = client.get(f"/api/documents/{created['id']}", headers=bob_headers)
    assert response.status_code == 404

    bob_docs = client.get("/api/documents", headers=bob_headers)
    assert bob_docs.status_code == 200
    assert bob_docs.json() == []


def test_owner_can_rename_and_delete(client, alice_headers):
    created = create_document(client, alice_headers)
    updated = client.patch(
        f"/api/documents/{created['id']}",
        headers=alice_headers,
        json={"title": "Updated proposal"},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated proposal"

    deleted = client.delete(f"/api/documents/{created['id']}", headers=alice_headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/documents/{created['id']}", headers=alice_headers).status_code == 404


def test_viewer_cannot_update_or_delete(client, alice_headers, bob_headers):
    created = create_document(client, alice_headers)
    share = client.post(
        f"/api/documents/{created['id']}/shares",
        headers=alice_headers,
        json={"user_id": 2, "permission": "viewer"},
    )
    assert share.status_code == 200

    update = client.patch(
        f"/api/documents/{created['id']}",
        headers=bob_headers,
        json={"content": EMPTY_DOC},
    )
    assert update.status_code == 403

    delete = client.delete(f"/api/documents/{created['id']}", headers=bob_headers)
    assert delete.status_code == 403


def test_editor_can_edit_but_cannot_share_or_delete(client, alice_headers, bob_headers):
    created = create_document(client, alice_headers)
    shared = client.post(
        f"/api/documents/{created['id']}/shares",
        headers=alice_headers,
        json={"user_id": 2, "permission": "editor"},
    )
    assert shared.status_code == 200

    bob_list = client.get("/api/documents", headers=bob_headers)
    assert bob_list.status_code == 200
    assert bob_list.json()[0]["permission"] == "editor"
    assert bob_list.json()[0]["is_owner"] is False

    update = client.patch(
        f"/api/documents/{created['id']}",
        headers=bob_headers,
        json={"title": "Bob edited this", "content": EMPTY_DOC},
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Bob edited this"
    assert update.json()["permission"] == "editor"

    attempt_to_share = client.post(
        f"/api/documents/{created['id']}/shares",
        headers=bob_headers,
        json={"user_id": 1, "permission": "viewer"},
    )
    assert attempt_to_share.status_code == 403

    attempt_to_delete = client.delete(f"/api/documents/{created['id']}", headers=bob_headers)
    assert attempt_to_delete.status_code == 403

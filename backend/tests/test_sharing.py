def test_owner_can_share_list_and_revoke(client, alice_headers, bob_headers):
    created = client.post(
        "/api/documents",
        headers=alice_headers,
        json={"title": "Shared notes", "content": {"type": "doc", "content": []}},
    ).json()
    document_id = created["id"]

    shared = client.post(
        f"/api/documents/{document_id}/shares",
        headers=alice_headers,
        json={"user_id": 2, "permission": "editor"},
    )
    assert shared.status_code == 200
    assert shared.json()["permission"] == "editor"
    assert shared.json()["user"]["name"] == "Bob"

    shares = client.get(f"/api/documents/{document_id}/shares", headers=alice_headers)
    assert shares.status_code == 200
    assert len(shares.json()) == 1

    # Re-sharing updates permission instead of creating a duplicate row.
    updated_share = client.post(
        f"/api/documents/{document_id}/shares",
        headers=alice_headers,
        json={"user_id": 2, "permission": "viewer"},
    )
    assert updated_share.status_code == 200
    assert updated_share.json()["permission"] == "viewer"
    assert len(client.get(f"/api/documents/{document_id}/shares", headers=alice_headers).json()) == 1

    bob_access = client.get(f"/api/documents/{document_id}", headers=bob_headers)
    assert bob_access.status_code == 200
    assert bob_access.json()["permission"] == "viewer"

    revoked = client.delete(
        f"/api/documents/{document_id}/shares/2",
        headers=alice_headers,
    )
    assert revoked.status_code == 204
    assert client.get(f"/api/documents/{document_id}", headers=bob_headers).status_code == 404


def test_only_owner_can_list_shares(client, alice_headers, bob_headers):
    created = client.post(
        "/api/documents",
        headers=alice_headers,
        json={"title": "Private", "content": {"type": "doc", "content": []}},
    ).json()
    response = client.get(f"/api/documents/{created['id']}/shares", headers=bob_headers)
    assert response.status_code == 404

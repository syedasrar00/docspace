from io import BytesIO


def test_import_markdown_preserves_heading_and_bold(client, alice_headers):
    response = client.post(
        "/api/documents/import",
        headers=alice_headers,
        files={"file": ("meeting-notes.md", BytesIO(b"# Meeting Notes\n\nThis is **important**."), "text/markdown")},
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["title"] == "meeting-notes"
    assert payload["content"]["type"] == "doc"
    assert payload["content"]["content"][0]["type"] == "heading"
    paragraph = payload["content"]["content"][1]
    assert paragraph["content"][1]["marks"] == [{"type": "bold"}]


def test_import_txt_creates_paragraphs(client, alice_headers):
    response = client.post(
        "/api/documents/import",
        headers=alice_headers,
        files={"file": ("quick-notes.txt", BytesIO(b"First paragraph\n\nSecond paragraph"), "text/plain")},
    )
    assert response.status_code == 201
    nodes = response.json()["content"]["content"]
    assert len(nodes) == 2
    assert nodes[0]["content"][0]["text"] == "First paragraph"


def test_import_rejects_unsupported_extension(client, alice_headers):
    response = client.post(
        "/api/documents/import",
        headers=alice_headers,
        files={"file": ("proposal.docx", BytesIO(b"not a docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert response.status_code == 415


def test_import_rejects_empty_file(client, alice_headers):
    response = client.post(
        "/api/documents/import",
        headers=alice_headers,
        files={"file": ("empty.txt", BytesIO(b""), "text/plain")},
    )
    assert response.status_code == 400

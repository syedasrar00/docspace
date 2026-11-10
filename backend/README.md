# DocSpace — FastAPI backend

FastAPI backend for the DocSpace React frontend. It implements the API contract in the companion `docspace-frontend` project.

## Features

- Demo login for seeded Alice and Bob accounts, with signed JWT bearer tokens.
- Current-user endpoint and server-side identity derived from the token.
- SQLAlchemy 2.x models backed by a local SQLite database file.
- Document create, list, read, update, and delete operations.
- TipTap JSON persistence so headings, marks, and lists survive reloads.
- Owner, editor, and viewer authorization enforced in backend routes.
- Document sharing, permission changes, and revocation.
- TXT and Markdown import (maximum 1 MB) into editable TipTap JSON.
- Basic automated API tests for auth, document access, sharing, and imports.
- FastAPI Swagger UI at `/docs`.

## Requirements

- Python 3.11+
- `uv` (recommended) or `pip`

## Local setup with uv

From this directory:

```powershell
uv sync --extra dev
Copy-Item .env.example .env
uv run uvicorn app.main:app --reload --port 8000
```

The API starts at `http://localhost:8000`.

- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- SQLite file: `docspace.db` in this backend directory by default

On macOS/Linux, copy the environment file with `cp .env.example .env`.

### Alternative with pip

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Connect the React frontend

In `docspace-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

The API allows the Vite origin `http://localhost:5173` by default. Change `FRONTEND_ORIGIN` in the backend `.env` if the frontend runs elsewhere.

## Demo accounts

The database initializer creates these users if they do not already exist:

| Name | Email |
|---|---|
| Alice | `alice@docspace.demo` |
| Bob | `bob@docspace.demo` |

There are no passwords. The login endpoint only accepts users already present in the database. This is simulated authentication for the assignment, not production identity verification.

## Authentication

1. The frontend calls `POST /api/auth/demo-login` with a demo email.
2. The backend returns a signed JWT, token type, and user object.
3. Authenticated requests send `Authorization: Bearer <access_token>`.
4. `get_current_user` verifies the signature and expiry, then loads the user from SQLite.
5. Document endpoints derive the user from the token; they do not trust a client-provided `user_id`.

JWT settings:

- `SECRET_KEY`: signing secret; replace it with a long random secret outside local development.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: token lifetime (default 720 minutes).
- `JWT_ALGORITHM`: HS256 in code.

## Authorization rules

| Action | Owner | Editor | Viewer |
|---|---:|---:|---:|
| Read document | Yes | Yes | Yes |
| Edit content | Yes | Yes | No |
| Rename | Yes | Yes | No |
| Share / change permission / revoke | Yes | No | No |
| Delete | Yes | No | No |

Private or inaccessible documents return `404` from document read/list access checks to avoid exposing whether a document ID exists. A user who can read but cannot perform a requested mutation receives `403`.

## API endpoints

All endpoints are under `/api` except `/health`.

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| POST | `/api/auth/demo-login` | No | Issue a demo JWT |
| GET | `/api/auth/me` | Yes | Current authenticated user |
| GET | `/api/users` | Yes | List demo users for sharing |
| GET | `/api/documents` | Yes | Owned and shared document summaries |
| POST | `/api/documents` | Yes | Create document |
| GET | `/api/documents/{id}` | Yes | Read a document and its TipTap content |
| PATCH | `/api/documents/{id}` | Yes | Rename and/or update content |
| DELETE | `/api/documents/{id}` | Yes | Owner-only delete |
| POST | `/api/documents/import` | Yes | Import `.txt` or `.md` |
| GET | `/api/documents/{id}/shares` | Owner | List collaborators |
| POST | `/api/documents/{id}/shares` | Owner | Grant access or update permission |
| DELETE | `/api/documents/{id}/shares/{user_id}` | Owner | Revoke access |
| GET | `/health` | No | Health check |

### Create document request

```json
{
  "title": "Untitled document",
  "content": {
    "type": "doc",
    "content": [{ "type": "paragraph" }]
  }
}
```

### Patch document request

Either field can be sent independently (the frontend uses this for separate rename and autosave requests):

```json
{ "title": "Project proposal" }
```

```json
{
  "content": {
    "type": "doc",
    "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Draft" }] }]
  }
}
```

### Sharing request

```json
{ "user_id": 2, "permission": "editor" }
```

Valid permissions are `editor` and `viewer`. Sharing an already-shared document with the same user updates the existing permission, rather than inserting a duplicate.

### File import

`POST /api/documents/import` accepts multipart form data with a `file` field. Only `.txt` and `.md` extensions are allowed; content must be UTF-8 and no larger than 1 MB by default. The filename (without extension) becomes the document title. Markdown headings, paragraphs, bold, italic, strike-through, lists, blockquotes, and code blocks are converted to the corresponding TipTap JSON structures where supported by the editor's configured extensions. Unsupported Markdown features are ignored or reduced to plain text.

## Database schema

Three tables are created automatically:

- `users`: seeded demo users.
- `documents`: document title, TipTap JSON content, owner, and timestamps.
- `document_shares`: the user/document relationship plus `viewer` or `editor` permission. A unique constraint prevents duplicate shares for the same user and document.

The SQLite file is stored at `backend/docspace.db` by default. Set `DATABASE_URL` to another SQLAlchemy URL to use a different location/engine. For a hosted deployment, configure a persistent disk/volume for the SQLite file; ephemeral filesystems can lose the database during redeploys or restarts.

## Run tests

```powershell
uv sync --extra dev
uv run pytest
```

Tests cover login, missing authentication, document creation and persistence, private-document access, owner/editor/viewer rules, sharing and revocation, and TXT/Markdown import.

## Deployment notes

- Run `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (use the platform's port variable).
- Set a strong `SECRET_KEY` and the correct `FRONTEND_ORIGIN`.
- Attach persistent storage for `docspace.db` if using SQLite.
- This demo login is intentionally not suitable for a public production service. Anyone who can reach the demo login can select Alice or Bob. Use a real identity provider/password flow and secure cookies for production.
- This app does not implement real-time collaborative editing. Edits are autosaved as complete TipTap JSON documents; concurrent edits from different browsers can overwrite each other. Real-time collaboration/version conflict handling is outside this assignment MVP.

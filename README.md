# DocSpace — Collaborative Document Workspace

DocSpace is a lightweight, full-stack collaborative document editor built for the Ajaia AI-Native Full Stack Developer assignment. It provides document creation and editing, file import, sharing, and persistent storage through a React frontend and a FastAPI backend.

The application is intentionally scoped as an assignment MVP. It demonstrates the key product flows without attempting to recreate all of Google Docs.

## 1. Features

- **Demo authentication:** Sign in as one of the two seeded users, Alice or Bob.
- **Document management:** Create, open, rename, edit, and delete documents.
- **Rich-text editing:** Bold, italic, underline, headings, bullet lists, and numbered lists using TipTap.
- **Autosave:** Editor changes are saved automatically to the backend.
- **File import:** Import `.txt` and `.md` files as editable documents. Maximum upload size is 1 MB.
- **Document sharing:** Share documents with another demo user as an Editor or Viewer, and revoke access.
- **Persistence:** Document content and sharing relationships are stored in a local SQLite database.
- **Backend authorization:** The API checks document ownership and sharing permissions on every protected operation.

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router |
| Rich-text editor | TipTap |
| UI icons | Lucide React |
| Backend | Python 3.11+, FastAPI |
| API validation | Pydantic |
| ORM | SQLAlchemy 2.x |
| Database | SQLite |
| Authentication | Signed JWT bearer tokens (PyJWT) |
| Markdown import | markdown-it-py |
| Automated tests | pytest, HTTPX |

## 3. Project structure

Place the two extracted project folders alongside this README as shown below. The frontend and backend ZIP files contain top-level folders named `docspace-frontend` and `docspace-backend`; rename those extracted folders to `frontend` and `backend`, respectively, or move their contents into folders with those names.

```text
 docspace/
 ├── README.md
 ├── frontend/
 │   ├── src/
 │   │   ├── components/
 │   │   ├── context/
 │   │   ├── pages/
 │   │   └── services/
 │   ├── .env.example
 │   ├── package.json
 │   └── vite.config.js
 │
 └── backend/
     ├── app/
     │   ├── dependencies/
     │   ├── routers/
     │   ├── schemas/
     │   ├── services/
     │   ├── config.py
     │   ├── database.py
     │   ├── main.py
     │   └── models.py
     ├── tests/
     ├── .env.example
     ├── pyproject.toml
     └── requirements.txt
```

The SQLite database file (`backend/docspace.db`) is created automatically when the backend starts. It is generated at runtime and is not required in the source ZIP.

## 4. Prerequisites

Install the following tools before running the project:

- **Node.js 20.19 or newer** and npm.
- **Python 3.11 or newer**.
- **uv** for Python dependency and environment management. The backend also includes a `requirements.txt` for pip-based installation.

Check your installed versions:

```bash
node --version
npm --version
python --version
uv --version
```

## 5. Configure and run the backend

Open a terminal in the `docspace/backend` directory.

### Windows PowerShell

```powershell
Copy-Item .env.example .env
uv sync --extra dev
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### macOS / Linux

```bash
cp .env.example .env
uv sync --extra dev
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

- API base URL: `http://localhost:8000`
- Swagger documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

On startup, the backend creates the SQLite tables and inserts the demo users if they do not already exist. The default database location is `backend/docspace.db`.

### Alternative: install backend dependencies with pip

From the `backend` directory:

```bash
python -m venv .venv
```

Activate the environment:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
source .venv/bin/activate
```

Then install and run:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## 6. Configure and run the frontend

Open a **second terminal** in the `docspace/frontend` directory.

### Windows PowerShell

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

### macOS / Linux

```bash
cp .env.example .env
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5173`.

The frontend `.env` file should contain:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Keep the backend running while using the frontend. The frontend sends API requests to the configured `VITE_API_BASE_URL`.

### Frontend production build

From the `frontend` directory:

```bash
npm run build
npm run preview
```

## 7. Demo accounts and authentication

The application uses two seeded demo accounts:

| User | Email | Demo purpose |
|---|---|---|
| Alice | `alice@docspace.demo` | Create and own documents; share them with Bob |
| Bob | `bob@docspace.demo` | Open documents shared by Alice and collaborate according to the granted permission |

There are no passwords. Select a demo user on the login screen. The backend issues a signed JWT, and the frontend attaches it to protected API requests using:

```http
Authorization: Bearer <access_token>
```

The backend derives the current user from the verified token. It does not trust a `user_id` supplied by the browser as proof of identity.

**This is simulated authentication for the assignment, not production authentication.** Anyone who can access the demo login can select either account. The frontend stores the short-lived demo token in `localStorage` for assessment convenience.

## 8. Sharing and permission rules

The backend enforces these permissions. Hiding a button in the frontend is not treated as authorization.

| Action | Owner | Editor | Viewer |
|---|:---:|:---:|:---:|
| View document | Yes | Yes | Yes |
| Edit document content | Yes | Yes | No |
| Rename document | Yes | Yes | No |
| Share or change permission | Yes | No | No |
| Revoke access | Yes | No | No |
| Delete document | Yes | No | No |

Private or inaccessible documents are not exposed to users who do not have access. A Viewer can open and read a document but cannot modify it.

## 9. Database schema

The application uses three SQLite tables managed through SQLAlchemy:

### `users`

Stores the seeded demo users.

- `id` — primary key.
- `name` — display name.
- `email` — unique email address.
- `created_at` — creation timestamp.

### `documents`

Stores document metadata and TipTap content.

- `id` — document identifier.
- `title` — document title.
- `content` — TipTap-compatible JSON structure.
- `owner_id` — foreign key to `users.id`.
- `created_at` — creation timestamp.
- `updated_at` — last update timestamp.

### `document_shares`

Stores access granted to other users.

- `id` — primary key.
- `document_id` — foreign key to `documents.id`.
- `user_id` — foreign key to `users.id`.
- `permission` — `editor` or `viewer`.
- `created_at` — share creation timestamp.

A unique constraint on `(document_id, user_id)` prevents duplicate share records for the same user and document.

TipTap content is stored as structured JSON so that headings, formatting marks, and lists are preserved when a document is reopened.

## 10. API overview

All application API routes are prefixed with `/api`. Protected endpoints require a JWT bearer token.

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| POST | `/api/auth/demo-login` | Sign in as a seeded demo user | No |
| GET | `/api/auth/me` | Get the current user | Yes |
| GET | `/api/users` | List users available for sharing | Yes |
| GET | `/api/documents` | List owned and shared documents | Yes |
| POST | `/api/documents` | Create a document | Yes |
| GET | `/api/documents/{id}` | Retrieve a document | Yes |
| PATCH | `/api/documents/{id}` | Rename or update document content | Yes |
| DELETE | `/api/documents/{id}` | Delete an owned document | Yes |
| POST | `/api/documents/import` | Import a `.txt` or `.md` file | Yes |
| GET | `/api/documents/{id}/shares` | List document collaborators | Owner |
| POST | `/api/documents/{id}/shares` | Grant access or change permission | Owner |
| DELETE | `/api/documents/{id}/shares/{user_id}` | Revoke a user's access | Owner |
| GET | `/health` | Check API health | No |

The full request and response examples are documented in `frontend/README.md` and `backend/README.md`. Interactive API documentation is available at `http://localhost:8000/docs` while the backend is running.

## 11. Run automated backend tests

From the `backend` directory:

```bash
uv sync --extra dev
uv run pytest
```

The tests cover authentication, document creation and access, owner/editor/viewer permissions, sharing and revocation, and TXT/Markdown imports.

## 12. End-to-end walkthrough

Use the following flow to verify the main product behavior:

1. Start the backend and frontend in separate terminals.
2. Open `http://localhost:5173` and sign in as **Alice**.
3. Create a document, give it a title, and add formatted text.
4. Wait for the save indicator to confirm that changes have been saved.
5. Return to the workspace and confirm that the document appears under Alice's documents.
6. Open the document's sharing dialog and share it with **Bob** as an **Editor**.
7. Switch accounts and sign in as **Bob**.
8. Open the document under **Shared with me**, make an edit, and confirm that it saves.
9. Switch back to Alice and change Bob's permission to **Viewer**.
10. Sign in as Bob again and verify that the document is read-only.
11. Test revoking Bob's access and confirm that he can no longer open the document.
12. Also test importing a `.txt` or `.md` file and reopening the imported document.

## 13. Configuration

### Backend `.env`

The backend reads these settings from `backend/.env`:

```env
SECRET_KEY=replace-this-with-a-long-random-secret-before-deployment
ACCESS_TOKEN_EXPIRE_MINUTES=720
DATABASE_URL=sqlite:///./docspace.db
FRONTEND_ORIGIN=http://localhost:5173
MAX_UPLOAD_SIZE_BYTES=1048576
```

The default database URL is resolved by the backend configuration to a SQLite file in the backend project directory. `FRONTEND_ORIGIN` controls the allowed frontend origin for CORS. Multiple comma-separated origins can be configured if needed.

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:8000
```

Do not commit real deployment secrets or environment files containing credentials.

## 14. Scope and known limitations

The following features are deliberately outside this assignment MVP:

- Real-time simultaneous editing, live cursors, and presence indicators.
- Comments, suggestion mode, and version history.
- DOCX import/export and PDF export.
- Folder management and advanced search.
- Production user registration, password management, and enterprise identity integration.

Autosave submits the current TipTap document JSON. If two users edit the same document at the same time, one save may overwrite the other's changes. Conflict resolution and real-time collaboration would require an additional collaboration layer and are not implemented here.

## 15. Deployment notes

The frontend and backend can be deployed separately or behind a common application domain. Configure the frontend API URL and backend CORS origin to match the deployed URLs.

For a hosted backend:

- Set a strong, unique `SECRET_KEY`.
- Set `FRONTEND_ORIGIN` to the deployed frontend origin.
- Set the platform's required host and port when starting Uvicorn, for example:

  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
  ```

- Attach persistent storage for `docspace.db`. A SQLite file on an ephemeral filesystem may be lost when the service restarts or redeploys.
- Do not expose the mock demo-login flow as a production authentication system.

## 16. Troubleshooting

**Frontend reports that the API cannot be reached**

- Confirm the backend is running on port `8000`.
- Check `frontend/.env` and make sure `VITE_API_BASE_URL` is correct.
- Restart the Vite server after changing `.env`.

**CORS error in the browser**

- Confirm `FRONTEND_ORIGIN=http://localhost:5173` in `backend/.env`.
- Restart the FastAPI server after changing the setting.

**Demo login fails**

- Confirm the backend started successfully and initialized the database.
- Check the backend terminal for startup or SQLite errors.
- Use exactly `alice@docspace.demo` or `bob@docspace.demo` through the login screen.

**Token or authorization error**

- Sign out and sign in again to obtain a fresh token.
- Verify that the requested document is owned by the current user or shared with them.
- Check the permission level: Viewers cannot edit, rename, share, or delete.

---

**DocSpace** — built as a focused full-stack product slice for the AI-Native Full Stack Developer assignment.

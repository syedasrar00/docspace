# DocSpace — React frontend

A React/Vite frontend for the lightweight collaborative document editor assignment. It is designed to work with the FastAPI API contract documented below.

## Features included

- Demo login with the seeded Alice and Bob accounts.
- JWT bearer token attached to API requests.
- Workspace lists for owned documents and documents shared with the current user.
- Create, open, rename and delete owned documents.
- TipTap rich-text editing: bold, italic, underline, H1/H2/H3, bullet lists and numbered lists.
- Debounced autosave with sequential writes to avoid overlapping content updates.
- TXT and Markdown import (1 MB maximum; backend performs final validation and Markdown conversion).
- Owner sharing dialog with editor/viewer permissions and revoke access.
- Read-only editor behavior for viewer permission.
- Responsive layout and API error states.

## Requirements

- Node.js 20.19+ (or a compatible newer LTS release)
- npm
- FastAPI backend running separately

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the environment template with:

```powershell
Copy-Item .env.example .env
```

The Vite development server runs at `http://localhost:5173`.

Set `VITE_API_BASE_URL` in `.env` to the FastAPI origin, for example:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Build and preview:

```bash
npm run build
npm run preview
```

## Demo accounts

The login screen expects these seeded users to exist in the backend:

- Alice — `alice@docspace.demo`
- Bob — `bob@docspace.demo`

The frontend calls `POST /api/auth/demo-login` with the selected email. The backend should return a signed JWT and the authenticated user object. This is deliberately mock authentication for the assessment, not production identity verification.

## Backend API contract expected by this frontend

All API endpoints are relative to `VITE_API_BASE_URL`. Authenticated calls include:

```http
Authorization: Bearer <access_token>
```

### Authentication

`POST /api/auth/demo-login`

Request:

```json
{ "email": "alice@docspace.demo" }
```

Response:

```json
{
  "access_token": "<signed-jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "name": "Alice", "email": "alice@docspace.demo" }
}
```

`GET /api/auth/me` returns the current user:

```json
{ "id": 1, "name": "Alice", "email": "alice@docspace.demo" }
```

### Users

`GET /api/users` returns an array of users:

```json
[
  { "id": 1, "name": "Alice", "email": "alice@docspace.demo" },
  { "id": 2, "name": "Bob", "email": "bob@docspace.demo" }
]
```

### Documents

`GET /api/documents` returns an array (or `{ "items": [...] }`) of document summaries. Each summary should include:

```json
{
  "id": "doc-uuid",
  "title": "Project Proposal",
  "owner_id": 1,
  "owner": { "id": 1, "name": "Alice", "email": "alice@docspace.demo" },
  "permission": "owner",
  "is_owner": true,
  "updated_at": "2026-11-10T12:00:00Z"
}
```

`POST /api/documents` request:

```json
{
  "title": "Untitled document",
  "content": { "type": "doc", "content": [{ "type": "paragraph" }] }
}
```

It returns the created document, including `id`, `title`, `content`, `owner_id`, `permission`, `is_owner` and `updated_at`.

`GET /api/documents/{id}` returns the full document with the TipTap JSON `content`.

`PATCH /api/documents/{id}` accepts either or both fields:

```json
{ "title": "Updated title" }
```

or

```json
{ "content": { "type": "doc", "content": [{ "type": "paragraph" }] } }
```

`DELETE /api/documents/{id}` should return HTTP 204. Backend authorization must allow deletion only for the owner.

### Sharing

`POST /api/documents/{id}/shares`

```json
{ "user_id": 2, "permission": "editor" }
```

`GET /api/documents/{id}/shares` returns an array such as:

```json
[
  {
    "id": 1,
    "document_id": "doc-uuid",
    "user_id": 2,
    "permission": "editor",
    "user": { "id": 2, "name": "Bob", "email": "bob@docspace.demo" }
  }
]
```

`DELETE /api/documents/{id}/shares/{user_id}` revokes access and returns HTTP 204.

For this MVP, only the owner may grant or revoke shares. Editors may update document content and rename the document. Only the owner may share, revoke access or delete.

### File import

`POST /api/documents/import` accepts `multipart/form-data` with a field named `file`. The frontend sends `.txt` and `.md` files, limited to 1 MB. The backend must validate the file extension/content, convert Markdown to TipTap-compatible JSON, create a document owned by the authenticated user and return the created document.

## CORS

For local development, FastAPI should allow the Vite origin `http://localhost:5173`.

## Important integration notes

1. The backend must derive the current user from the JWT. Do not accept a client-supplied `user_id` as proof of identity.
2. The backend must enforce owner/editor/viewer permissions on every document operation; hiding a button in React is not authorization.
3. Document `content` must be TipTap-compatible JSON so formatting survives save/reopen.
4. The autosave endpoint should accept partial PATCH updates. The frontend sends only `{ "content": ... }` when autosaving.
5. The current frontend stores its short-lived demo JWT in `localStorage` for assessment convenience. For a production application, use a stronger auth design such as secure, HttpOnly cookies and appropriate CSRF protection.
6. A server-hosted SQLite file needs persistent storage on the deployment platform if data must survive restarts/redeploys.

## Project structure

```text
src/
  components/       Reusable UI: sidebar, document list, editor, sharing, feedback
  context/          Authentication context
  pages/            Login, workspace and editor routes
  services/         Central API client and endpoint modules
  App.jsx           Route configuration
  main.jsx          React entry point
  styles.css        Responsive application styling
```

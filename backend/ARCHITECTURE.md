# DocSpace architecture note

## Chosen scope

DocSpace is a deliberately small collaborative document editor. The backend exposes one FastAPI application and stores all data in a local SQLite file through SQLAlchemy. It is designed to satisfy the assignment's primary flows without adding operational dependencies.

## Main design decisions

1. **TipTap JSON is the persisted document format.** This preserves formatting and structure across save/reopen. The backend validates the top-level document shape and stores the structured payload as JSON.
2. **Users are seeded demo identities.** Alice and Bob can be selected through a mock login endpoint. The backend signs a JWT and derives the current user from it on every authenticated request.
3. **Sharing is a separate many-to-many relationship.** `documents.owner_id` represents ownership; `document_shares` represents explicit collaborator access and permission.
4. **Authorization is enforced server-side.** Owner, editor, and viewer rights are checked before reading or mutating documents. Frontend visibility is only a usability aid, never the security boundary.
5. **Uploads become documents.** TXT and Markdown files up to 1 MB are decoded and converted into TipTap-compatible JSON, then saved as normal documents.
6. **No real-time collaboration.** The frontend uses debounced autosave. Simultaneous independent edits may overwrite each other; Yjs/WebSockets and version conflict resolution were intentionally deferred.

## Tradeoffs and next improvements

- SQLite keeps local setup and deployment simple, but hosted deployment requires a persistent volume. A production multi-instance service should use a managed relational database.
- Demo login is intentionally not real identity verification. A production implementation should integrate an identity provider or password-based authentication and use secure HttpOnly cookies.
- The MVP stores the latest document state only. A version history or optimistic concurrency token would reduce accidental overwrites when multiple users edit simultaneously.
- Markdown conversion covers common structures, not every Markdown extension or embedded asset.

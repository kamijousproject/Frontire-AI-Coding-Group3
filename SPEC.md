# TeamBoard Card Feature Specification

## Goal

Authenticated users post cards (text + category) to a shared board. Cards persist in `cards.json` on the server filesystem.

---

## Actors & Authorization

| Actor         | Can Read | Can Create | Can Delete |
|---------------|----------|------------|------------|
| Authenticated user | Yes  | Yes        | Own cards only |
| Unauthenticated    | No   | No         | No         |

Auth mechanism: JWT bearer token in `Authorization` header. Reject missing/invalid/expired tokens with `401`.

---

## Data Model

```json
{
  "id": "uuid-v4",
  "text": "string (1–10,000 chars, stripped of leading/trailing whitespace)",
  "category": "bug | feature | task | question",
  "authorId": "uuid-v4 (from JWT sub claim)",
  "createdAt": "ISO 8601 UTC timestamp"
}
```

### Field Rules

| Field      | Required | Constraints |
|------------|----------|-------------|
| `text`     | Yes      | 1–10,000 chars after trim. Reject empty/whitespace-only. |
| `category` | Yes      | One of: `bug`, `feature`, `task`, `question`. Case-insensitive on input, stored lowercase. |
| `id`       | Server   | Generated server-side. Never accepted from client. |
| `authorId` | Server   | Extracted from JWT. Never accepted from client. |
| `createdAt`| Server   | Generated server-side. Never accepted from client. |

---

## API

### POST /cards — Create card

**Request**
```
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "text": "string",
  "category": "string"
}
```

**Success response — 201 Created**
```json
{
  "id": "uuid",
  "text": "...",
  "category": "...",
  "authorId": "...",
  "createdAt": "2026-05-07T00:00:00Z"
}
```

**Error responses**

| Condition | Status | `code` |
|-----------|--------|--------|
| Missing/invalid JWT | 401 | `UNAUTHORIZED` |
| `text` missing or empty after trim | 400 | `TEXT_REQUIRED` |
| `text` exceeds 10,000 chars | 400 | `TEXT_TOO_LONG` |
| `category` missing | 400 | `CATEGORY_REQUIRED` |
| `category` not in allowed list | 400 | `CATEGORY_INVALID` |
| Board at max capacity (10,000 cards) | 409 | `BOARD_FULL` |
| File write failure | 503 | `STORAGE_ERROR` |

All errors return:
```json
{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE" }
```

### GET /cards — List cards

**Request**
```
Authorization: Bearer <jwt>
```

**Success response — 200 OK**
```json
{
  "cards": [ /* array of card objects */ ],
  "total": 42
}
```

Pagination: query params `?page=1&limit=50` (default limit 50, max 100).

---

## Storage

- Path: resolved from env var `CARDS_FILE_PATH`. Default: `./data/cards.json` relative to process CWD.
- Never derive path from user input.
- On startup: if file missing, create it with contents `[]` and permissions `0600`. If creation fails, log error and refuse to start.
- Write strategy: write to `cards.tmp.json` → `fsync` → atomic rename to `cards.json`. Prevents corruption on crash.
- Concurrent writes: serialize via in-process async queue (no parallel writes to file).
- Max cards: 10,000. Reject new cards with `409 BOARD_FULL` when limit reached.

---

## Performance SLA

- `POST /cards`: p95 < 200ms, p99 < 500ms, measured at the server under 100 concurrent users.
- `GET /cards`: p95 < 100ms under same load.
- Measured in staging environment on equivalent hardware to production. Load test must pass before merge.

---

## Rate Limiting

- Per authenticated user: 10 POSTs per minute. Exceed → `429 Too Many Requests` with `Retry-After` header.
- Per IP (unauthenticated probes): 20 requests per minute across all endpoints.

---

## Security Requirements

- **Input sanitization**: strip all HTML tags from `text` before storage. Encode `<`, `>`, `&`, `"`, `'` on output.
- **CORS**: allow only origins defined in `ALLOWED_ORIGINS` env var. Reject all others.
- **File permissions**: `cards.json` created with mode `0600`. Directory with mode `0700`.
- **No path traversal**: `CARDS_FILE_PATH` must be an absolute path or resolve to one within the app data directory. Reject at startup if outside allowed prefix.
- **No sensitive data in logs**: do not log JWT tokens, `authorId`, or card text.
- **Headers**: respond with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`.

---

## Testability Criteria

Every requirement must have a corresponding test. Specifically:

| Requirement | Test type |
|-------------|-----------|
| 201 on valid card | Integration |
| 400 on empty text | Integration |
| 400 on text > 10,000 chars | Integration |
| 400 on invalid category | Integration |
| 401 on missing JWT | Integration |
| 409 when board full (10,000 cards) | Integration |
| 503 on write failure (mock fs) | Integration |
| Atomic write: no corruption on simulated crash | Integration |
| Concurrent POSTs produce no duplicate IDs | Integration |
| Rate limit: 11th request in 1 min returns 429 | Integration |
| p95 < 200ms under 100 concurrent users | Load test |
| CORS rejects unlisted origin | Integration |
| HTML stripped from stored text | Unit |

---

## Out of Scope (v1)

- Card editing or updating
- Card search or filtering beyond category
- Multi-board support
- Real-time updates (WebSocket)
- File encryption at rest (tracked in backlog)

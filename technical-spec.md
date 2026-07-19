# Architecture Overview

Single Next.js 15 (App Router) application serving both frontend and backend — no separate API service. TypeScript throughout. Tailwind + shadcn/ui for UI primitives. Prisma as the ORM against Supabase Postgres. NextAuth (Credentials provider) for mock/seeded authentication. TipTap as the rich text editor, with content persisted as HTML.

```
┌─────────────────────────────────────────────┐
│                Next.js App                    │
│                                                 │
│  App Router pages (RSC)                       │
│   ├─ /login                                    │
│   ├─ /documents            (list: mine/shared) │
│   ├─ /documents/[id]       (editor)            │
│                                                 │
│  API Route Handlers (/app/api/*)               │
│   ├─ /api/auth/[...nextauth]                   │
│   ├─ /api/documents        (GET, POST)         │
│   ├─ /api/documents/[id]   (GET, PATCH)        │
│   ├─ /api/documents/[id]/share (POST, DELETE)  │
│   ├─ /api/import           (POST — file upload)│
│                                                 │
│  lib/                                          │
│   ├─ prisma.ts   (singleton client)            │
│   ├─ auth.ts     (NextAuth config)             │
│   ├─ validation.ts (zod schemas)                │
│                                                 │
│  TipTap Editor Component (client)              │
└───────────────────┬─────────────────────────────┘
                    │ Prisma Client
                    ▼
          Supabase Postgres (hosted)
```

**Why this shape:** one deployable unit avoids cross-service networking/config risk within a 4–6 hour window. Route Handlers double as the "backend" without a separate Express/Nest server. Server Components fetch data directly via Prisma for the document list; the editor page is a client component (TipTap requires the DOM).

# Data Model

Prisma schema (Postgres via Supabase):

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  // NextAuth Credentials: password is hashed, stored only for seeded demo users
  password  String
  documents Document[] @relation("OwnedDocuments")
  shares    DocumentShare[]
  createdAt DateTime @default(now())
}

model Document {
  id         String   @id @default(cuid())
  title      String
  content    String   @db.Text   // TipTap HTML output
  ownerId    String
  owner      User     @relation("OwnedDocuments", fields: [ownerId], references: [id])
  shares     DocumentShare[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model DocumentShare {
  id          String   @id @default(cuid())
  documentId  String
  document    Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([documentId, userId]) // one share record per user per document
}
```

**Notes:**
- `content` stores TipTap's serialized HTML directly — no separate JSON/delta format. Simplest option that round-trips cleanly through the editor.
- Sharing is binary (a row exists = access granted); no `role` column, matching the PRD's non-goal of role-based permissions.
- `onDelete: Cascade` on shares ensures deleting a document doesn't leave orphaned share rows.
- Seed script creates 2–3 `User` rows with known emails/passwords for reviewer login.

# API Design

All routes under `/app/api`, using Route Handlers. Auth required on every route except `/api/auth/*` (enforced via `getServerSession` at the top of each handler).

| Method | Route | Purpose | Auth Rule |
|---|---|---|---|
| POST | `/api/auth/callback/credentials` | NextAuth login | Public |
| GET | `/api/documents` | List documents: owned + shared-with-me | Session required |
| POST | `/api/documents` | Create a new blank document | Session required |
| GET | `/api/documents/[id]` | Fetch a document | Owner or shared user only |
| PATCH | `/api/documents/[id]` | Update title and/or content | Owner or shared user only |
| POST | `/api/documents/[id]/share` | Grant access to a user (by userId or email) | Owner only |
| DELETE | `/api/documents/[id]/share` | Revoke access (stretch, optional) | Owner only |
| POST | `/api/import` | Upload `.txt`/`.md`, create new document from content | Session required |

**Response shape convention:**
```json
// success
{ "data": { ... } }
// error
{ "error": { "message": "string", "code": "VALIDATION_ERROR" } }
```

**GET /api/documents** returns two arrays explicitly (`owned`, `shared`) rather than one mixed list with a flag — keeps the "My Documents" vs "Shared With Me" UI split trivial to render.

# Authentication Strategy

- **NextAuth v5 with Credentials provider** — no OAuth, no email verification, no password reset flow (out of scope per PRD).
- Seeded users only: a `prisma/seed.ts` script creates 2–3 users with bcrypt-hashed passwords and prints their email/password to the console and README.
- Login page is a simple email + password form; effectively acts as the "user switcher" — logging out and back in as a different seeded user simulates multi-user testing.
- Session strategy: JWT (NextAuth default with Credentials provider — no DB session table needed, reduces Prisma schema surface).
- `getServerSession(authOptions)` used in every Route Handler and Server Component that needs the current user; unauthenticated requests return `401`.
- No route-level middleware for auth beyond redirecting unauthenticated users away from `/documents/*` — kept simple, checked per-request in handlers/pages.

**Explicitly excluded:** OAuth providers, magic links, password reset, email verification, real user self-registration (registration UI is optional/stretch only, seeding covers reviewer needs).

# Sharing Model

- Sharing is **owner-initiated and binary**: a `DocumentShare` row means "this user can view and edit this document." No distinct read/write roles.
- **Grant access:** Owner opens a "Share" dialog (shadcn `Dialog`), selects a seeded user from a dropdown (populated from `/api/users` or a static list — no free-text email entry, avoiding unnecessary input validation complexity), and submits to `POST /api/documents/[id]/share`.
- **Access check:** Every read/write to a document (`GET`/`PATCH /api/documents/[id]`) verifies `ownerId === session.user.id OR a DocumentShare row exists for (documentId, session.user.id)`. Centralized in a small helper, `canAccessDocument(userId, documentId)`, to avoid duplicating this check across handlers.
- **Visibility split:** `GET /api/documents` queries owned docs (`where: { ownerId: session.user.id }`) and shared docs (`where: { shares: { some: { userId: session.user.id } } }`) separately, returned as two arrays for direct UI mapping.
- **Revocation** (optional/stretch): `DELETE` on the share route removes the row; not required for MVP but trivial to add given the schema.

# File Import Design

- **Scope:** only `.txt` and `.md` files are accepted. `.docx` and other formats are explicitly rejected with a clear error — no OOXML parsing.
- **Flow:**
  1. Client: a file `<input accept=".txt,.md">` inside an "Import from file" control (shadcn `Button` + hidden input).
  2. Client reads the file as text via `FileReader` (or sends as `multipart/form-data` to the API — either works; multipart to the API is preferred for consistent server-side validation).
  3. `POST /api/import` receives the file, validates extension and MIME type server-side (never trust the client-side `accept` attribute alone).
  4. **`.txt`** content is wrapped in a single `<p>` per line (or `<pre>` for simplicity) to produce valid TipTap-compatible HTML.
  5. **`.md`** content is converted to HTML using a small, well-tested Markdown-to-HTML library (e.g., `marked` or `remark`) before being stored — avoids hand-rolling a Markdown parser.
  6. A new `Document` row is created with `title` derived from the filename (stripped of extension) and `content` set to the converted HTML.
  7. API returns the new document's `id`; client redirects to `/documents/[id]`.
- **Size limit:** a small server-side file size cap (e.g., 1MB) to prevent pathological uploads; rejected with a clear error if exceeded.

# Validation Rules

Using `zod` schemas in `lib/validation.ts`, validated at the top of each Route Handler before touching Prisma.

- **Create document:** `title` optional (defaults to `"Untitled Document"`), `content` optional (defaults to empty).
- **Rename/update document:** `title` — if provided, must be a non-empty string, max ~200 chars. `content` — if provided, must be a string (HTML), max size guarded (e.g., 500KB) to avoid unbounded payloads.
- **Share:** `userId` (or `email`) required, must reference an existing `User`; cannot share a document with its own owner (no-op/error).
- **Import:** file must have `.txt` or `.md` extension AND a matching/plausible MIME type; file size must be under the configured cap; rejects empty files.
- **Auth (login):** `email` valid format, `password` non-empty; generic "invalid credentials" message on failure (no user enumeration).

All validation failures return `400` with a structured `{ error: { message, code } }` payload the frontend can render inline near the relevant form field/action.

# Error Handling

- **Consistent envelope:** every API error returns `{ error: { message, code } }` with an appropriate HTTP status (`400` validation, `401` unauthenticated, `403` unauthorized/no access, `404` not found, `500` unexpected).
- **Centralized handler helper:** a small `handleApiError(err)` utility wraps zod errors, Prisma known errors (e.g., unique constraint violations on duplicate shares), and unexpected exceptions into the standard envelope — avoids repeating try/catch boilerplate per route.
- **Frontend:** API calls go through a thin client wrapper (`lib/api-client.ts`) that surfaces `error.message` to the UI via shadcn `Toast`/inline alert components — no silent failures, no unhandled promise rejections.
- **Access control failures** (`403`) are treated distinctly from `404` where it matters for UX (e.g., "You don't have access to this document" vs. "Document not found") but may collapse to a generic "not found" for documents the user has zero relationship to, to avoid leaking existence of private documents.
- **Import errors** (bad extension, oversized file) are shown immediately next to the upload control, not as a generic toast, since the user needs to correct the specific file chosen.

# Deployment Strategy

- **Platform:** Vercel (single-service deploy of the Next.js app) — matches the framework, zero-config for Route Handlers, free tier sufficient.
- **Database:** Supabase Postgres (free tier project), connection string stored as `DATABASE_URL` in Vercel environment variables.
- **Migrations:** `prisma migrate deploy` run against Supabase as part of the build step (or manually once pre-launch); `prisma/seed.ts` run once post-deploy (via a one-off script or Supabase SQL editor) to create demo users/documents.
- **Environment variables required:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set to the production Vercel URL).
- **No paid add-ons:** Vercel free tier + Supabase free tier satisfy the "no paid dependency" constraint.
- **Reviewer access:** the deployed URL requires no VPN/team login — only the in-app seeded-user login, which credentials are provided in the README/SUBMISSION.md.

# Test Strategy

Kept intentionally minimal per the PRD (one meaningful automated test required; avoid over-investing).

- **Framework:** Vitest (fast, TS-native, minimal config) or Jest — either is fine; Vitest preferred for speed with Next.js/TS.
- **Primary test (required):** an integration-style test for the sharing access-control helper — e.g., `canAccessDocument`:
  - Owner can access their own document.
  - A user with a `DocumentShare` row can access the document.
  - A user with neither relationship cannot access the document.
  - This directly covers the riskiest, most reviewer-scrutinized behavior (sharing correctness).
- **Optional additional tests (time-permitting, not required):**
  - Import route rejects a non-`.txt`/`.md` file with a `400`.
  - Document creation defaults `title` to `"Untitled Document"` when omitted.
- **Not in scope:** end-to-end browser tests (Playwright/Cypress), full API test coverage, editor rendering tests — these cost more time than they return credit for in this exercise's rubric.
# Implementation Task Breakdown

## Task 1
**Goal:** Scaffold the Next.js 15 project with TypeScript, Tailwind, and shadcn/ui.
**Deliverable:** A running local app (`npm run dev`) with Tailwind styling working and 2–3 shadcn components (Button, Dialog, Input) installed and rendering on a placeholder page.
**Dependencies:** None
**Estimated Time:** 20 min

## Task 2
**Goal:** Set up Supabase Postgres project and connect Prisma.
**Deliverable:** A Supabase project created, `DATABASE_URL` in `.env`, Prisma initialized (`prisma init`), and `prisma db push`/`migrate dev` successfully connecting (empty schema is fine at this point).
**Dependencies:** Task 1
**Estimated Time:** 20 min

## Task 3
**Goal:** Define the full Prisma schema (`User`, `Document`, `DocumentShare`).
**Deliverable:** `schema.prisma` matching the data model in the tech spec, migration applied successfully to Supabase, Prisma Client generated.
**Dependencies:** Task 2
**Estimated Time:** 20 min

## Task 4
**Goal:** Write and run the seed script for demo users.
**Deliverable:** `prisma/seed.ts` creating 2–3 users with bcrypt-hashed passwords; running it populates the `User` table; credentials documented in a scratch note for later README use.
**Dependencies:** Task 3
**Estimated Time:** 20 min

## Task 5
**Goal:** Configure NextAuth with the Credentials provider.
**Deliverable:** `/api/auth/[...nextauth]` route working; a basic login page at `/login` where a seeded user can sign in and get a valid JWT session; `getServerSession` confirmed working on a test page.
**Dependencies:** Task 4
**Estimated Time:** 35 min

## Task 6
**Goal:** Build the `canAccessDocument` authorization helper and centralized error-handling utility.
**Deliverable:** `lib/access.ts` with a function checking owner/share access; `lib/errors.ts` with `handleApiError` returning the standard `{ error: { message, code } }` envelope. Both unit-testable in isolation (no routes needed yet).
**Dependencies:** Task 3 (schema must exist)
**Estimated Time:** 25 min

## Task 7
**Goal:** Implement Document CRUD API routes (create, list, get, update/rename).
**Deliverable:** Working `POST /api/documents`, `GET /api/documents` (returning `owned`/`shared` arrays), `GET /api/documents/[id]`, `PATCH /api/documents/[id]` — all enforcing session auth and the access helper, validated with zod, tested manually via curl/Postman.
**Dependencies:** Tasks 5, 6
**Estimated Time:** 50 min

## Task 8
**Goal:** Implement the sharing API route.
**Deliverable:** `POST /api/documents/[id]/share` (grant access) working end-to-end, restricted to the document owner, validated against zod schema (existing user, not self-share).
**Dependencies:** Task 7
**Estimated Time:** 25 min

## Task 9
**Goal:** Build the document list UI ("My Documents" / "Shared With Me").
**Deliverable:** `/documents` page rendering two sections from `GET /api/documents`, using shadcn components (Card/Table), with a "New Document" button that calls `POST /api/documents` and redirects to the editor.
**Dependencies:** Task 7
**Estimated Time:** 40 min

## Task 10
**Goal:** Integrate TipTap editor with rich text controls.
**Deliverable:** `/documents/[id]` page with a working TipTap editor supporting bold, italic, underline, headings, bulleted/numbered lists, with a visible toolbar; loads existing `content` on mount.
**Dependencies:** Task 7
**Estimated Time:** 60 min

## Task 11
**Goal:** Wire editor save/autosave and rename to the API.
**Deliverable:** Editing content triggers `PATCH /api/documents/[id]` (debounced autosave or explicit Save button with visible confirmation state); title field is editable and persists via the same route.
**Dependencies:** Task 10
**Estimated Time:** 30 min

## Task 12
**Goal:** Build the Share dialog UI.
**Deliverable:** A "Share" button on the editor page opening a shadcn `Dialog` with a dropdown of other seeded users; submitting calls `POST /api/documents/[id]/share`; success/error feedback shown inline.
**Dependencies:** Tasks 8, 10
**Estimated Time:** 30 min

## Task 13
**Goal:** Implement the file import API route (`.txt`/`.md`).
**Deliverable:** `POST /api/import` accepting multipart upload, validating extension/MIME/size, converting `.md` via a Markdown-to-HTML library and `.txt` via simple line-wrapping, creating a new `Document` row, returning its `id`.
**Dependencies:** Task 7
**Estimated Time:** 40 min

## Task 14
**Goal:** Build the file import UI.
**Deliverable:** An "Import from file" control on the document list page (file input restricted to `.txt`/`.md`, with supported-format text visible), calling `/api/import` and redirecting to the new document on success; errors shown inline on failure.
**Dependencies:** Tasks 9, 13
**Estimated Time:** 25 min

## Task 15
**Goal:** Pass on validation and error handling across all routes and forms.
**Deliverable:** Every route confirmed to return structured errors for bad input (empty title, invalid share target, bad file type/size); frontend confirmed to surface each via inline messages or toasts — no silent failures or unhandled console errors during manual click-through.
**Dependencies:** Tasks 7, 8, 11, 13, 14
**Estimated Time:** 30 min

## Task 16
**Goal:** Write the required automated test for sharing access control.
**Deliverable:** A passing Vitest (or Jest) test suite for `canAccessDocument` covering owner access, shared-user access, and no-access cases.
**Dependencies:** Task 6
**Estimated Time:** 25 min

## Task 17
**Goal:** Deploy to Vercel with Supabase as production DB.
**Deliverable:** Live URL with env vars (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`) configured, migrations applied to production DB, seed script run once against production, full flow manually verified on the live URL in an incognito window.
**Dependencies:** Tasks 1–14 functionally complete
**Estimated Time:** 35 min

## Task 18
**Goal:** Write README, architecture note, AI workflow note, and SUBMISSION.md.
**Deliverable:** All four documents completed per the deliverables checklist, including seeded credentials, setup steps verified on a clean clone, and explicit statement of scope cuts.
**Dependencies:** Task 17
**Estimated Time:** 40 min

## Task 19
**Goal:** Record the 3–5 minute walkthrough video.
**Deliverable:** An unlisted Loom/YouTube link covering main flow, what works end-to-end, deprioritized features, key decisions, and AI usage.
**Dependencies:** Task 17 (needs a working live app to demo)
**Estimated Time:** 30 min (incl. one re-record buffer)

---

## Critical Path Tasks
These block core Acceptance Criteria and cannot be skipped or meaningfully deferred:

- Task 1 — Project scaffold
- Task 2 — Supabase + Prisma connection
- Task 3 — Prisma schema
- Task 4 — Seed script
- Task 5 — NextAuth Credentials setup
- Task 6 — Access helper + error handling utility
- Task 7 — Document CRUD API
- Task 8 — Sharing API
- Task 9 — Document list UI
- Task 10 — TipTap editor integration
- Task 11 — Save/rename wiring
- Task 12 — Share dialog UI
- Task 13 — File import API
- Task 14 — File import UI
- Task 16 — Required automated test
- Task 17 — Deployment
- Task 18 — Required written deliverables
- Task 19 — Required video

**Total critical path estimate: ~8 hours nominal** — over the stated 4–6 hour budget. See note below on where to compress.

## Nice-to-Have Tasks
Not required by the PRD/Acceptance Criteria; add only if ahead of schedule:

- **Task 15 (validation/error polish pass)** — a lighter, opportunistic version of this (spot-checking the worst failure modes rather than a full pass) is enough; don't block on it.
- Share revocation (`DELETE` on the share route) — schema already supports it, but not required.
- Autosave debouncing refinement (vs. a simple manual Save button) — manual save is acceptable and faster to build.
- Additional tests beyond the one required (import validation, default-title behavior).
- Toast-based global error UI polish beyond basic inline messages.
- Any stretch feature from the assignment (export, real-time indicators, etc.) — explicitly out of scope.

**Compression guidance if running over budget:** cut Task 15 to a 10-minute spot-check, use a manual Save button instead of autosave (saves time in Task 11), skip share revocation entirely, and keep the video/README lean rather than exhaustive — these reductions bring the realistic total closer to the 5–6 hour upper bound without touching any Acceptance Criteria.
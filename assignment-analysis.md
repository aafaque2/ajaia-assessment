# Assignment Analysis

## Mandatory Requirements

**Document Editing**
- [ ] Create a new document
- [ ] Rename a document
- [ ] Edit content in-browser
- [ ] Save and reopen documents (persistence-backed, not just in-memory)
- [ ] Rich text: bold, italic, underline
- [ ] Headings / text size variation
- [ ] Bulleted or numbered lists

**File Upload**
- [ ] At least one upload flow that is "product-relevant" (not a throwaway file dump)
- [ ] Clearly stated supported file types in UI + README if limited

**Sharing**
- [ ] Concept of a document owner
- [ ] Mechanism to grant another user access
- [ ] Visible UI distinction between "owned" vs "shared with me"
- [ ] Users may be simulated (seeded accounts / mock auth acceptable)

**Persistence**
- [ ] Documents survive refresh
- [ ] Formatting/structure preserved (not just plain text dump)
- [ ] Sharing state persists and is demonstrable

**Engineering Quality**
- [ ] README with setup/run instructions
- [ ] Live, reviewer-accessible deployment
- [ ] Basic validation/error handling
- [ ] At least one automated test
- [ ] Architecture note (Markdown/PDF)

**AI Workflow Note**
- [ ] Tools used
- [ ] Where AI sped things up
- [ ] What AI output was changed/rejected
- [ ] How correctness/UX/reliability were verified

**Video**
- [ ] 3–5 min walkthrough: main flow, what works end-to-end, deprioritized items, key decisions, AI usage

**Submission Package**
- [ ] Google Drive folder: source code, README, architecture note, AI workflow note, SUBMISSION.md, live URL, video URL text file, screenshots/GIF if setup needs extra steps
- [ ] Test credentials/seeded users for reviewing sharing flow
- [ ] No paid dependencies required for reviewers

---

## Ambiguous Requirements
- **"Product-relevant" file upload** — no fixed spec; could be interpreted as import-to-document, attachment, or draft injection. Open to designer's choice, but must justify it.
- **Auth model** — "mocked auth or lightweight login" leaves a wide range from a dropdown user-switcher to real JWT auth. Under-speccing risks looking lazy; over-speccing wastes hours.
- **"Reasonable" formatting preservation** — no schema given (HTML? JSON delta? Markdown?). Ambiguous how rich the persisted structure needs to be.
- **Sharing granularity** — "grant another user access" doesn't specify read vs. write, revocation, or multi-user sharing. Minimum bar is unclear.
- **Deployment path** — "preferred path" is open; but must be free and reviewer-accessible without a login wall of its own (e.g., Vercel behind team auth would fail).
- **Test scope** — "at least one meaningful automated test" is vague on what "meaningful" means (unit vs integration vs e2e).

---

## Hidden Reviewer Expectations
- Reviewers are staff-level engineers grading **judgment under constraint**, not feature count — a padded feature list without clear cuts will read as poor prioritization.
- They expect the **AI workflow note to show critical use of AI**, not "Claude wrote everything." Specific examples of rejected/edited AI output are a screening signal for AI-native maturity.
- They will likely **test the sharing flow personally** using seeded credentials — if this breaks or credentials are missing, it's an instant credibility hit.
- They expect the **README to work verbatim** on a fresh clone — broken setup instructions are a common disqualifier.
- The **video is doubling as a proxy for communication skills** — expect them to weight clarity and honesty about tradeoffs as much as the demo itself.
- A **SUBMISSION.md** functions as a checklist proof — reviewers will use it to verify claims against actual delivered artifacts, so mismatches (claiming something works that doesn't) are worse than just not building it.
- Explicit stated cuts ("I did not do X because Y") are a **positive signal**, not a negative one — the brief says this outright twice.

---

## Recommended MVP Scope
- Single full-stack app (frontend + backend + DB) with 2–3 seeded users and a simple user-switcher for mock auth.
- Rich text editor via an existing library (Tiptap, Quill, or Slate) — no custom-built editor.
- Content persisted as HTML (or the library's native serialization) in a `Document` table alongside title, owner, and timestamps.
- File upload limited to `.txt`/`.md`, converted directly into a new editable document; `.docx` explicitly declared out of scope.
- Sharing modeled as owner + a simple list of users granted access (binary access, no roles); clear "My Documents" vs "Shared With Me" UI split.
- One meaningful automated test (e.g., sharing grants visibility to the correct user).
- Single-service deployment (e.g., Vercel/Render) with a hosted DB (Supabase/Neon) or SQLite if the platform allows persistent storage.

---

## Features To Explicitly Deprioritize
- Full Google Docs parity
- Enterprise-grade access control / permission systems
- Real-time collaborative editing (CRDT/OT) — stretch only
- Commenting, suggestion mode, version history — stretch only
- Export to PDF/Markdown — stretch only
- Role-based/granular permissions — stretch only
- `.docx` binary parsing (OOXML) — high complexity, low required value
- Drag-drop upload UX, progress bars, previews
- Visual polish beyond basic usability
- Large/high-coverage test suites — one meaningful test suffices
- Multi-service, exotic deployment topologies

---

## Risk Areas
- **Time bleed on editor library integration** — rich text editors have real setup friction (schema config, serialization format) that can consume 1–2 hours if unfamiliar.
- **Persistence format lock-in** — choosing a schema too late risks reformatting work; decide upload/storage format (e.g., HTML string or JSON) before building the editor.
- **Deployment failing silently for reviewers** — env vars, DB connection strings, or CORS issues that work locally but break in production are the most common "silent failure" in take-homes.
- **Forgetting seeded credentials in the deliverable** — reviewers can't test sharing without this; easy to forget under time pressure.
- **AI note becoming generic** — a vague/templated AI note undermines the AI-native hiring signal the whole exercise is testing for.
- **Video overrun/underrun** — going over 5 minutes or failing to hit all five required talking points looks like poor communication discipline.

---

## Success Criteria
A submission succeeds if a reviewer can, in under 10 minutes:
1. Open the live URL and log in/select a seeded user without any setup.
2. Create, edit (with visible rich formatting), rename, and reopen a document with formatting intact.
3. Upload a file and see it become or attach to a document.
4. Log in as a second seeded user and see a document shared with them, distinguishable from their own.
5. Read a concise architecture note that explains real tradeoffs (not boilerplate).
6. Read an AI workflow note with concrete, specific examples of AI use and correction.
7. Watch a tight 3–5 min video that maps to what's actually in the app (no undocumented surprises, no overclaiming).
8. Find README instructions that work exactly as written on a clean environment.

---

# Implementation Strategy (4–6 Hour Plan)

**Stack choice (minimize risk):** A single full-stack framework (e.g., Next.js) with a hosted Postgres (Supabase/Neon) or even SQLite via a serverless-friendly ORM (Prisma), deployed to Vercel/Render as one unit. Use Tiptap or Quill for rich text — do not hand-roll.

**Hour 0–0.5 — Lock scope & schema**
- Decide: mock auth via user-switcher dropdown (2–3 seeded users), no real login.
- Decide: file upload = "upload .txt/.md → creates new editable document." State .docx explicitly out of scope in README.
- Decide: storage format = HTML string (matches most rich text libraries' native output) in a `content` field.
- Sketch DB schema: `User`, `Document(ownerId, title, content, updatedAt)`, `DocumentShare(documentId, userId)`.

**Hour 0.5–2 — Backend + persistence**
- Scaffold app, DB, and API routes: create/list/get/update/rename document, create share, list shared-with-me.
- Seed 2–3 users at startup/migration.
- Basic validation (title required, file type check, share target exists) and error responses.

**Hour 2–3.5 — Editor + document flows**
- Integrate Tiptap/Quill, wire to save (autosave or explicit save) and reload from persisted HTML.
- Build document list UI: "My Documents" vs "Shared With Me" sections.
- Build create/rename/open flows.

**Hour 3.5–4.5 — File upload + sharing UI**
- Simple upload input → parse .txt/.md → create new document.
- Share modal: pick a seeded user, grant access; reflect immediately in their document list.

**Hour 4.5–5 — Testing, validation, error handling pass**
- Write one meaningful test (e.g., API-level: creating a share correctly grants document visibility to the target user).
- Sanity-pass on error states (bad file type, empty title, sharing with nonexistent user).

**Hour 5–6 — Deploy, document, record**
- Deploy; verify live URL works from a fresh incognito session.
- Write README, architecture note, AI workflow note, SUBMISSION.md.
- Record 3–5 min walkthrough covering: flow demo, what works, what was cut (real-time collab, .docx parsing, granular roles), key decisions (editor library choice, mock auth, storage format), and AI usage specifics.

**Cut immediately if behind schedule:** file upload polish, autosave debouncing, multiple share recipients, any stretch goal. Never cut: persistence correctness, sharing visibility, deployment reachability, README accuracy — these are what reviewers will actually click through.
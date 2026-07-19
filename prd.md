# Product Overview

A lightweight collaborative document editor, inspired by Google Docs, that lets users create, edit, format, upload, and share text documents with other users. The product demonstrates a coherent full-stack slice: rich-text editing, file import, basic sharing, and durable persistence — scoped tightly to what can be built and shipped in 4–6 hours. It intentionally excludes real-time collaboration, comments, and version history in favor of depth in core editing, sharing, and reliability.

# User Personas

**Owner (Primary Author)**
A user who creates and edits their own documents, imports content from files, and decides who else can see their work. Cares about a fast, reliable editor and simple control over sharing.

**Collaborator (Shared Recipient)**
A user who has been granted access to someone else's document. Cares about being able to quickly find and open documents shared with them, clearly separated from their own.

**Reviewer (Evaluator)**
Not an in-product persona but a stand-in for the person grading the submission: needs to log in as a seeded user in seconds, exercise every core flow without setup friction, and see clear evidence of what works.

# User Stories

**Document Editing**
- As an Owner, I can create a new blank document so I can start writing immediately.
- As an Owner, I can rename a document so I can organize my work.
- As an Owner, I can format text (bold, italic, underline, headings, bulleted/numbered lists) so my document is readable and structured.
- As an Owner, I can save my document and reopen it later with formatting intact, so I don't lose work.

**File Upload**
- As an Owner, I can upload a `.txt` or `.md` file so its content becomes a new editable document, without retyping it.
- As an Owner, I am clearly told which file types are supported, so I don't waste time on unsupported formats.

**Sharing**
- As an Owner, I can grant another seeded user access to a document so they can view/edit it.
- As a Collaborator, I can see documents shared with me in a distinct list, separate from documents I own, so I know what's mine versus what's shared.
- As a Reviewer, I can switch between seeded users to verify that sharing works as intended.

**Reliability**
- As any user, I see a clear error message if I try an invalid action (e.g., empty title, unsupported file type, sharing with a nonexistent user), so the app never fails silently.

# Core Features

1. **Document CRUD** — create, rename, edit, save, and reopen documents.
2. **Rich Text Editing** — bold, italic, underline, headings/text size, bulleted and numbered lists, via an existing editor library (not custom-built).
3. **File Upload Import** — upload `.txt`/`.md` files that are converted into a new editable document.
4. **Mock Multi-User Sharing** — seeded users, a way to grant document access to another seeded user, and a UI split between "My Documents" and "Shared With Me."
5. **Persistence Layer** — documents and sharing relationships stored durably (SQL database), surviving refresh and reflecting current state.
6. **Basic Validation & Error Handling** — required fields, supported file types, valid share targets.

# Non-Goals

- Real-time collaborative editing (no live cursors, no concurrent multi-user editing, no CRDT/OT).
- Commenting or suggestion mode.
- Document version history or revision tracking.
- Enterprise-grade or role-based (viewer/editor/admin) permission systems — sharing is binary (has access / doesn't).
- Full `.docx` (OOXML) parsing — only plain-text-friendly formats (`.txt`, `.md`) are supported for upload.
- Real authentication (password reset, OAuth, sessions) — mock/seeded user switching is sufficient.
- Export to PDF/Markdown, drag-and-drop upload UX, or visual polish beyond basic usability.
- Feature parity with Google Docs.

# Acceptance Criteria

- [ ] A user can create a new document and it appears in their document list immediately.
- [ ] A user can rename a document and the new name persists after refresh.
- [ ] A user can apply bold, italic, underline, at least one heading level, and both list types, and see them rendered correctly in the editor.
- [ ] A user can save a document, refresh the page, and reopen it with all formatting intact.
- [ ] A user can upload a `.txt` or `.md` file and a new document is created containing that file's content.
- [ ] Uploading an unsupported file type shows a clear, specific error message (not a silent failure or generic crash).
- [ ] An Owner can grant a second seeded user access to a document.
- [ ] The Collaborator, after switching to their seeded account, sees the shared document under "Shared With Me" and can open it.
- [ ] "My Documents" and "Shared With Me" are visually and functionally distinct lists.
- [ ] Attempting to share with a nonexistent/invalid user, or save a document with an empty title, produces a clear error rather than failing silently.
- [ ] All of the above work on the live deployed URL, not just locally.
- [ ] At least one automated test verifies a core behavior (recommended: sharing grants correct visibility).

# UX Requirements

- **User switching**: a visible, always-accessible control (e.g., a dropdown in the header) to switch between seeded users, simulating login without building real auth.
- **Document list view**: two clearly labeled sections — "My Documents" and "Shared With Me" — each showing title and last-updated time at minimum.
- **Editor toolbar**: a simple, visible toolbar with buttons/controls for bold, italic, underline, heading/size, and list types — no hidden keyboard-shortcut-only formatting.
- **Save feedback**: the user should be able to tell when a document has been saved (e.g., autosave indicator or explicit save confirmation) — silent, unconfirmed saves undermine trust in persistence.
- **Upload entry point**: a clearly labeled upload control (e.g., "Import from file") with visible supported-format text next to it.
- **Share entry point**: a clearly labeled "Share" action on a document that lets the owner pick a seeded user from a list (avoid free-text email entry, which adds unnecessary validation complexity).
- **Error visibility**: validation and error messages appear inline near the relevant action (not just console errors or silent no-ops).
- **No login wall for reviewers**: the live URL must be reachable and testable without requesting credentials from Anthropic/the reviewing team — seeded-user switching happens inside the app.

# Success Metrics

*(For this exercise, "success" is evaluator-perceived quality and completeness rather than production usage metrics.)*

- **Functional completeness**: 100% of Acceptance Criteria demonstrable on the live deployed build.
- **Time-to-first-successful-flow**: a reviewer can complete create → edit → format → save → reopen in under 2 minutes without guidance.
- **Sharing verifiability**: a reviewer can confirm the sharing flow end-to-end (as both Owner and Collaborator) in under 2 minutes using seeded accounts.
- **Zero setup friction**: README instructions work on a first attempt in a clean environment, with no undocumented steps.
- **Failure transparency**: 0 silent failures during a full walkthrough of core flows (every invalid action produces a visible message).
- **Communication clarity**: the video and written notes explicitly name every deprioritized feature and the reasoning behind each cut.
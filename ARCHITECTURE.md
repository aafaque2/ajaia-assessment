# Architecture Document

This document outlines the high-level architecture, design decisions, and tradeoffs made for the Collaborative Document Editor assignment.

## Architecture Overview

The application is built as a monolithic full-stack web application using **Next.js 15 (App Router)**. This choice allows us to deeply integrate the frontend and backend, leveraging React Server Components (RSC) for fast initial data fetching and Server Actions for form submissions and mutations without needing to build a separate REST or GraphQL API.

- **Frontend**: React 19, Tailwind CSS, shadcn/ui. Client-side state for the rich-text editor is managed by **TipTap**, a headless wrapper around ProseMirror.
- **Backend**: Next.js Server Actions execute securely on the Node.js server to handle business logic and authorization.
- **Data Layer**: **Prisma ORM** interacting with a **PostgreSQL** database.

## Database Design

The database schema is designed to be minimal and relational, focusing on users, their documents, and access control.

1. **User**: Represents a system user. Includes `id`, `name`, `email`, and a hashed `password`.
2. **Document**: The core entity. Includes `id`, `title`, `content` (stored as `Json` to match TipTap's native abstract syntax tree), and an `ownerId` linking back to the User.
3. **DocumentShare**: A junction table enabling many-to-many relationships for document sharing. It links a `Document` to a `User` (the collaborator) and includes a `role` (e.g., `EDITOR`). A composite unique constraint ensures a user cannot be shared to the same document multiple times.

## Authentication Design

The application utilizes **Next-Auth** (Auth.js) with a Credentials provider. 
- Passwords are securely hashed via `bcryptjs` before entering the database.
- Sessions are managed via secure, HTTP-only JWT cookies.
- Server Actions explicitly verify the session context (`auth()`) to determine the acting user and validate permissions before any read/write operations occur.

*(Note: While the original PRD requested a simplified mock-user switcher to remove login friction, full authentication was prioritized here to establish a secure foundation for server actions and data access.)*

## Sharing Model

Sharing operates on a strict **Owner vs. Collaborator** binary model:
- **Ownership**: The user who creates a document is the `owner`. The owner has exclusive rights to delete the document or modify sharing permissions.
- **Collaboration**: Owners can grant access to other registered users by email. This creates a `DocumentShare` record with an `EDITOR` role.
- **Validation**: Every Server Action for document mutation (edit, rename) checks `canAccessDocument(userId, documentId)`, ensuring the requester is either the explicit owner or possesses a valid `DocumentShare` record.

## File Import Design

The file import flow is optimized to safely convert standard text formats (`.txt`, `.md`) into the rich-text JSON format required by TipTap.
1. **Client-side Read**: The browser uses the `FileReader` API to read the file contents as text. Basic validation (.txt/.md extension check) occurs here.
2. **Server Action Processing**: The text payload is sent to an `importDocument` Server Action.
3. **Parsing**: A custom server-side parsing utility converts Markdown syntax (headings, bold, italic, blockquotes, lists) into TipTap's structured JSON node format.
4. **Persistence**: The resulting JSON is inserted into the database as a new document, and the client is redirected to the newly generated document ID.

## Tradeoffs

1. **Database Content Storage (JSON vs. HTML/Markdown)**
   - *Decision*: We store document content as TipTap JSON nodes.
   - *Tradeoff*: While storing raw Markdown or HTML might be easier for external consumption, storing JSON ensures exact 1:1 mapping with the editor's state, preventing formatting data loss during conversion round-trips. It is, however, harder to run text-search queries directly in SQL.

2. **Save Mechanism (Autosave via Server Actions vs. WebSockets)**
   - *Decision*: The editor uses a debounced autosave that calls a Next.js Server Action over HTTP.
   - *Tradeoff*: Much simpler to implement and deploy than maintaining active WebSocket connections. The downside is increased HTTP overhead and a lack of real-time multi-user syncing (which was an explicit non-goal).

## Prioritization Decisions

- **Speed over Real-time Collaboration**: Building Operational Transformation (OT) or CRDTs for real-time collaboration would easily exceed the time limit. Dropping this allowed for deeper focus on durable persistence and reliable sharing mechanisms.
- **Binary Permissions**: Complex Role-Based Access Control (RBAC) was excluded. Currently, users either have access (can edit) or don't. Viewer-only modes were deprioritized to keep the database schema and sharing UI simple.
- **Pre-seeded Environment**: A robust Prisma seed script was prioritized so reviewers can immediately interact with the multi-tenant aspects of the app (Alice vs. Bob) without needing to manually register test accounts.

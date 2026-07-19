# AI Development Workflow

This document outlines the artificial intelligence tools and methodologies utilized during the planning, implementation, and review phases of this project. The strategic integration of various AI assistants was designed to accelerate development while maintaining high standards for architecture and documentation.

## AI Tools Utilized

The development lifecycle incorporated three primary AI assistants, each chosen for specific strengths:

1. **ChatGPT**: Utilized for initial project planning and high-level technical direction.
2. **Claude**: Leveraged for drafting comprehensive technical specifications and requirement documents (Markdown files).
3. **Opencode Big Pickle**: Handled all implementation and coding tasks for the application.
4. **Gemini (Antigravity)**: Employed for post-implementation code review, identifying architectural edge cases, and generating finalizing documentation (e.g., `README.md`, `ARCHITECTURE.md`).

## Specific Responsibilities

- **Planning Phase (ChatGPT)**: Assisted in breaking down the core requirements into a viable 4-6 hour development sprint. It provided the initial scaffolding for database entities and Next.js App Router structural concepts.
- **Documentation Phase (Claude)**: Responsible for generating the strict Product Requirements Document (`prd.md`) and Technical Specifications (`technical-spec.md`). Claude excels at structured, coherent, and exhaustive markdown generation, ensuring the project constraints were clearly codified.
- **Implementation Phase (Opencode Big Pickle)**: Wrote all of the application source code, including the Next.js UI, server actions, database schema logic with Prisma, and integration of the TipTap rich-text editor.
- **Review and Finalization Phase (Gemini / Antigravity)**: Acted as an automated Senior Engineer to audit the final codebase against the generated PRD. It identified requirement drift (e.g., the inclusion of real authentication over a simple user switcher) and synthesized the findings into actionable review reports and project documentation.

## Modified Outputs

While AI tools provided substantial velocity, their outputs required manual engineering oversight:
- **Scope Adjustments**: Planning outputs from ChatGPT occasionally expanded beyond the target scope. These were manually pruned to keep the project focused on core Document CRUD and sharing.
- **Documentation Alignment**: Claude's technical specifications were manually edited to accurately reflect the final implementation decisions, particularly around how TipTap JSON structures were stored versus raw Markdown.
- **Review Nuances**: Gemini's automated code reviews were manually vetted to ensure proposed fixes (e.g., replacing text inputs with dropdowns or handling Server Action errors) were practical within the repository's existing constraints.

## Rejected Outputs

To maintain a focused and maintainable codebase, several AI suggestions were explicitly rejected:
- **Real-time Collaboration**: AI suggestions recommending WebSockets, Operational Transformation (OT), or CRDTs were rejected to adhere to the "Non-Goals" defined in the PRD.
- **Complex Authentication & RBAC**: Suggestions for OAuth integrations, email verification flows, or granular role-based access control (Viewer, Commenter, Editor, Admin) were discarded in favor of a binary "Owner vs. Editor" sharing model.

## Verification Strategy

The verification strategy relied on a dual-pass approach:
1. **Self-Verification**: Manual cross-referencing of the implemented features against the PRD's Acceptance Criteria.
2. **AI-Assisted Audit**: Utilizing Gemini's agentic capabilities to traverse the workspace and evaluate Requirement Coverage, Product Quality, UX Quality, and Code Quality. This step proved invaluable for catching edge cases, such as unhandled Server Action errors during file imports.

## Testing Approach

- **Manual QA**: End-to-end testing of core user flows (Create, Edit, Save, Share) using the seeded accounts (Alice and Bob) to ensure correct session separation and permission enforcement.
- **Automated Testing**: Targeted automated tests using **Vitest** to verify the integrity of critical data transformations, specifically ensuring that imported text and markdown files are parsed correctly into the TipTap AST format without data loss.

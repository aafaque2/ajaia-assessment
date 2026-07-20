# Take-Home Assignment Submission

Thank you for the opportunity to work on this assignment. Below you will find all the required links and documentation for the Collaborative Document Editor.

## Deliverables

- **Source Code**: [GitHub Repository](https://github.com/aafaque2/ajaia-assessment)
- **Deployment URL**: [Live Application URL](https://ajaia-assessment-og.vercel.app/)
- **Walkthrough Video**: [YouTube Walkthrough](https://youtu.be/bu80Ng2Eb8s)

*Documentation Files:*
- **README**: [README.md](https://github.com/aafaque2/ajaia-assessment/blob/main/README.md) - Project overview and local setup instructions.
- **Architecture Note**: [ARCHITECTURE.md](https://github.com/aafaque2/ajaia-assessment/blob/main/ARCHITECTURE.md) - System design, database schema, and tradeoffs.
- **AI Workflow Note**: [AI_WORKFLOW.md](https://github.com/aafaque2/ajaia-assessment/blob/main/AI_WORKFLOW.md) - Details on how AI tools were utilized during development.

## Test Accounts

The following seeded accounts can be used to log in and test the sharing workflows (no sign-up required):

- **Owner/User A**: `alice@example.com` / `password123`
- **Collaborator/User B**: `bob@example.com` / `password123`

## Completed Features

- **Document CRUD**: Full ability to create, rename, edit, and delete documents.
- **Rich Text Editor**: Integrated TipTap editor supporting bold, italic, underline, headings, and lists.
- **File Import**: Users can upload `.txt` and `.md` files which are automatically parsed into editable rich-text documents.
- **Access Control & Sharing**: Documents are strictly partitioned. Owners can grant access to other registered users by email, and the dashboard clearly splits "My Documents" from "Shared With Me".
- **Durable Persistence**: Fully functioning PostgreSQL database via Prisma ORM, reliably persisting document states and sharing relationships.
- **Form Validations**: Server-side checks for empty document titles, unsupported file types, and unauthorized sharing attempts.

## Known Limitations

- **Silent Import Error**: If a file import fails server-side (e.g., if the file is too large), the UI currently transitions without exposing the error toast to the user.
- **Free-text Email Sharing**: The current sharing UI uses a free-text email input. While it properly rejects invalid emails via the server, a dropdown of seeded users would offer lower friction.
- **Autosave Edge Cases**: Saving a document with a completely empty title triggers a server-side error which is displayed as a small text indicator, but does not locally block the save attempt or revert the title visually.
- **No Real-time Collaboration**: In adherence to the PRD constraints, concurrent editing by two users on the same document simultaneously is not supported (last-write-wins applies).

## Future Improvements

If given an additional time, I would prioritize the following:

1. **Optimistic UI Updates**: Improve the sharing panel and document renaming flows to use optimistic UI updates (via React's `useOptimistic`) for a snappier, instant-feedback user experience.
2. **Simplified Mock Authentication**: Replace the password-based login with a simple one-click "Switch User" dropdown in the header to drastically reduce review and testing friction, as originally scoped.
3. **Enhanced Error Handling**: Implement robust global toast notifications (e.g., using `sonner` or `react-hot-toast`) to ensure no server-side validation errors are ever swallowed silently.
4. **Export Functionality**: Add functionality to export the TipTap JSON state back into downloadable `.md` or `.pdf` files.
5. **Presence Indicators**: Implement a minimal WebSocket server (e.g., using Socket.io or PartyKit) to display a "User X is also viewing this document" indicator to help prevent accidental concurrent overwrites.

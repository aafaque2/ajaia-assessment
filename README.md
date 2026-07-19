# Collaborative Document Editor

A lightweight collaborative document editor inspired by Google Docs, allowing users to create, edit, format, upload, and share text documents. Built as a coherent full-stack application demonstrating rich-text editing, file imports, basic sharing workflows, and durable persistence.

## Features

- **Document CRUD**: Create, rename, edit, save, and delete documents.
- **Rich Text Editing**: Formatting options including bold, italic, underline, headings, and lists (powered by TipTap).
- **File Import**: Upload and convert `.txt` and `.md` files into editable documents.
- **Document Sharing**: Share documents with other users, splitting the workspace into "My Documents" and "Shared With Me".
- **Durable Persistence**: All documents and sharing relationships are stored in a PostgreSQL database.
- **Authentication**: Seeded user login to demonstrate multi-user sharing workflows.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Rich Text Editor**: [TipTap](https://tiptap.dev/)
- **Authentication**: [Next-Auth](https://next-auth.js.org/)
- **Styling**: Tailwind CSS & shadcn/ui
- **Testing**: Vitest

## Local Setup

### 1. Clone & Install
```bash
git clone <repository-url>
cd ajaia-assessment
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
# Example Database URL (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# Next Auth Secret (Generate via: openssl rand -base64 32)
AUTH_SECRET="your_generated_secret_here"
```

### 3. Database Setup
Ensure you have a running PostgreSQL instance, then push the schema and seed the database:
```bash
npm run build # (Optional: Generate Prisma Client)
npx prisma db push
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running Tests

Automated tests are set up using Vitest. To execute them:
```bash
npm run test
```
To run tests in watch mode:
```bash
npm run test:watch
```

## Deployment Instructions

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project into your hosting provider of choice (e.g., [Vercel](https://vercel.com/)).
3. Configure the **Environment Variables** (`DATABASE_URL` and `AUTH_SECRET`) in your hosting provider's dashboard.
4. Ensure your build command is set to `npm run build` which will generate the Prisma Client and build the Next.js app.
5. Deploy.

*Note: Before first use in production, you will need to apply your schema and seed the database against your production PostgreSQL instance (e.g., `npx prisma db push` and `npx prisma db seed`).*

## Seed Users

You can use the following seeded accounts to log in and test the sharing workflows:

| Name  | Email             | Password      |
| ----- | ----------------- | ------------- |
| Alice | alice@example.com | password123   |
| Bob   | bob@example.com   | password123   |

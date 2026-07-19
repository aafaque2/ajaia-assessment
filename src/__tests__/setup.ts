import { vi } from "vitest";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock auth
let mockUserId: string | null = "test-user-id";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => {
    if (!mockUserId) return null;
    return { user: { id: mockUserId } };
  }),
}));

// Mock prisma with in-memory store
interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
}
interface StoredDocument {
  id: string;
  title: string;
  content: unknown;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
interface StoredShare {
  id: string;
  documentId: string;
  userId: string;
  role: string;
  createdAt: Date;
}

const users = new Map<string, StoredUser>();
const documents = new Map<string, StoredDocument>();
const shares = new Map<string, StoredShare>();

let docIdCounter = 0;
let shareIdCounter = 0;

export function resetStore() {
  users.clear();
  documents.clear();
  shares.clear();
  docIdCounter = 0;
  shareIdCounter = 0;
  mockUserId = "test-user-id";
}

export function seedUser(user: StoredUser) {
  users.set(user.id, user);
}

export function setMockUserId(id: string | null) {
  mockUserId = id;
}

export function getDocuments() {
  return documents;
}

export function getShares() {
  return shares;
}

function generateId(prefix: string) {
  if (prefix === "doc") return `doc-${++docIdCounter}`;
  return `${prefix}-${++shareIdCounter}`;
}

const mockPrisma = {
  document: {
    findUnique: vi.fn(async ({ where, select }: { where: { id: string }; select?: unknown }) => {
      const doc = documents.get(where.id);
      if (!doc) return null;
      if (select) {
        const result: Record<string, unknown> = { id: doc.id };
        const sel = select as Record<string, unknown>;
        if (sel.title) result.title = doc.title;
        if (sel.content) result.content = doc.content;
        if (sel.ownerId) result.ownerId = doc.ownerId;
        if (sel.createdAt) result.createdAt = doc.createdAt;
        if (sel.updatedAt) result.updatedAt = doc.updatedAt;
        if (sel.owner) {
          const owner = users.get(doc.ownerId);
          result.owner = owner
            ? { id: owner.id, name: owner.name, email: owner.email }
            : null;
        }
        return result;
      }
      return doc;
    }),
    create: vi.fn(async ({ data }: { data: { title: string; content: unknown; ownerId: string } }) => {
      const id = generateId("doc");
      const now = new Date();
      const doc: StoredDocument = {
        id,
        title: data.title,
        content: data.content,
        ownerId: data.ownerId,
        createdAt: now,
        updatedAt: now,
      };
      documents.set(id, doc);
      return doc;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const doc = documents.get(where.id);
      if (!doc) throw new Error("Document not found");
      Object.assign(doc, data, { updatedAt: new Date() });
      return doc;
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const doc = documents.get(where.id);
      documents.delete(where.id);
      return doc;
    }),
  },
  documentShare: {
    findUnique: vi.fn(async ({ where }: { where: { documentId_userId: { documentId: string; userId: string } } }) => {
      const key = `${where.documentId_userId.documentId}-${where.documentId_userId.userId}`;
      return shares.get(key) || null;
    }),
    findMany: vi.fn(async ({ where }: { where: { documentId: string } }) => {
      const results: Array<{ user: { id: string; name: string; email: string }; role: string }> = [];
      for (const share of shares.values()) {
        if (share.documentId === where.documentId) {
          const user = users.get(share.userId);
          if (user) {
            results.push({
              user: { id: user.id, name: user.name, email: user.email },
              role: share.role,
            });
          }
        }
      }
      return results;
    }),
    create: vi.fn(async ({ data }: { data: { documentId: string; userId: string; role: string } }) => {
      const key = `${data.documentId}-${data.userId}`;
      if (shares.has(key)) {
        throw new Error("Unique constraint failed");
      }
      const id = generateId("share");
      const share: StoredShare = {
        id,
        documentId: data.documentId,
        userId: data.userId,
        role: data.role,
        createdAt: new Date(),
      };
      shares.set(key, share);
      return share;
    }),
    deleteMany: vi.fn(async ({ where }: { where: { documentId: string; userId: string } }) => {
      let count = 0;
      for (const [key, share] of shares.entries()) {
        if (share.documentId === where.documentId && share.userId === where.userId) {
          shares.delete(key);
          count++;
        }
      }
      return { count };
    }),
  },
  user: {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.email) {
        for (const user of users.values()) {
          if (user.email === where.email) return { id: user.id, email: user.email, name: user.name, password: user.password };
        }
        return null;
      }
      if (where.id) return users.get(where.id) || null;
      return null;
    }),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  getPrisma: () => mockPrisma,
}));

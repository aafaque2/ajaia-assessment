import { describe, it, expect, beforeEach } from "vitest";
import {
  resetStore,
  seedUser,
  setMockUserId,
  getDocuments,
  getShares,
} from "../setup";
import { redirect } from "next/navigation";

const ownerId = "owner-1";
const editorId = "editor-1";
const strangerId = "stranger-1";

beforeEach(() => {
  resetStore();
  seedUser({
    id: ownerId,
    name: "Owner",
    email: "owner@test.com",
    password: "hashed",
  });
  seedUser({
    id: editorId,
    name: "Editor",
    email: "editor@test.com",
    password: "hashed",
  });
  seedUser({
    id: strangerId,
    name: "Stranger",
    email: "stranger@test.com",
    password: "hashed",
  });
  setMockUserId(ownerId);
});

describe("createDocument", () => {
  it("creates a document with default title and content", async () => {
    const { createDocument } = await import("@/app/documents/actions");

    await expect(createDocument()).rejects.toThrow("REDIRECT:/documents/doc-1");

    const docs = getDocuments();
    const doc = docs.get("doc-1");
    expect(doc).toBeDefined();
    expect(doc!.title).toBe("Untitled Document");
    expect(doc!.content).toEqual({
      type: "doc",
      content: [{ type: "paragraph" }],
    });
    expect(doc!.ownerId).toBe(ownerId);
  });

  it("redirects when no user is authenticated", async () => {
    setMockUserId(null);
    const { createDocument } = await import("@/app/documents/actions");

    await expect(createDocument()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("addShare", () => {
  let docId: string;

  beforeEach(async () => {
    const { createDocument } = await import("@/app/documents/actions");
    await createDocument().catch(() => {});
    docId = [...getDocuments().keys()][0];
  });

  it("allows owner to share document with another user", async () => {
    const { addShare } = await import("@/app/documents/actions");

    const result = await addShare(docId, "editor@test.com");
    expect(result).toEqual({ success: true, id: docId });

    const shares = getShares();
    expect(shares.size).toBe(1);
    const share = [...shares.values()][0];
    expect(share.documentId).toBe(docId);
    expect(share.userId).toBe(editorId);
    expect(share.role).toBe("EDITOR");
  });

  it("prevents sharing with non-existent email", async () => {
    const { addShare } = await import("@/app/documents/actions");

    const result = await addShare(docId, "nobody@test.com");
    expect(result).toEqual({
      success: false,
      error: "No user found with that email",
    });
  });

  it("prevents sharing with yourself", async () => {
    const { addShare } = await import("@/app/documents/actions");

    const result = await addShare(docId, "owner@test.com");
    expect(result).toEqual({
      success: false,
      error: "Cannot share with yourself",
    });
  });

  it("prevents duplicate sharing", async () => {
    const { addShare } = await import("@/app/documents/actions");

    await addShare(docId, "editor@test.com");
    const result = await addShare(docId, "editor@test.com");
    expect(result).toEqual({
      success: false,
      error: "Already shared with this user",
    });

    const shares = getShares();
    expect(shares.size).toBe(1);
  });

  it("prevents non-owner from sharing", async () => {
    setMockUserId(editorId);
    const { addShare } = await import("@/app/documents/actions");

    const result = await addShare(docId, "stranger@test.com");
    expect(result).toEqual({
      success: false,
      error: "Only the owner can share",
    });
  });

  it("allows sharing with multiple different users", async () => {
    const { addShare } = await import("@/app/documents/actions");

    await addShare(docId, "editor@test.com");
    await addShare(docId, "stranger@test.com");

    const shares = getShares();
    expect(shares.size).toBe(2);
  });
});

describe("removeShare", () => {
  let docId: string;

  beforeEach(async () => {
    const { createDocument, addShare } = await import("@/app/documents/actions");
    await createDocument().catch(() => {});
    docId = [...getDocuments().keys()][0];
    await addShare(docId, "editor@test.com");
  });

  it("allows owner to remove a share", async () => {
    const { removeShare } = await import("@/app/documents/actions");

    const result = await removeShare(docId, editorId);
    expect(result).toEqual({ success: true, id: docId });

    const shares = getShares();
    expect(shares.size).toBe(0);
  });

  it("prevents non-owner from removing a share", async () => {
    setMockUserId(editorId);
    const { removeShare } = await import("@/app/documents/actions");

    const result = await removeShare(docId, editorId);
    expect(result).toEqual({
      success: false,
      error: "Only the owner can remove access",
    });

    const shares = getShares();
    expect(shares.size).toBe(1);
  });

  it("silently succeeds when removing non-existent share", async () => {
    const { removeShare } = await import("@/app/documents/actions");

    const result = await removeShare(docId, strangerId);
    expect(result).toEqual({ success: true, id: docId });
  });
});

describe("canAccessDocument", () => {
  let docId: string;

  beforeEach(async () => {
    const { createDocument, addShare } = await import("@/app/documents/actions");
    await createDocument().catch(() => {});
    docId = [...getDocuments().keys()][0];
    await addShare(docId, "editor@test.com");
  });

  it("grants owner full access", async () => {
    const { canAccessDocument } = await import("@/app/documents/actions");

    const result = await canAccessDocument(ownerId, docId);
    expect(result).toEqual({ allowed: true, isOwner: true });
  });

  it("grants shared user access", async () => {
    const { canAccessDocument } = await import("@/app/documents/actions");

    const result = await canAccessDocument(editorId, docId);
    expect(result).toEqual({ allowed: true, isOwner: false });
  });

  it("denies access to uninvolved user", async () => {
    const { canAccessDocument } = await import("@/app/documents/actions");

    const result = await canAccessDocument(strangerId, docId);
    expect(result).toEqual({ allowed: false, isOwner: false });
  });

  it("denies access to non-existent document", async () => {
    const { canAccessDocument } = await import("@/app/documents/actions");

    const result = await canAccessDocument(ownerId, "fake-doc-id");
    expect(result).toEqual({ allowed: false, isOwner: false });
  });
});

describe("updateDocument", () => {
  let docId: string;

  beforeEach(async () => {
    const { createDocument, addShare } = await import("@/app/documents/actions");
    await createDocument().catch(() => {});
    docId = [...getDocuments().keys()][0];
    await addShare(docId, "editor@test.com");
  });

  it("allows owner to update title", async () => {
    const { updateDocument } = await import("@/app/documents/actions");

    const result = await updateDocument(docId, { title: "New Title" });
    expect(result).toEqual({ success: true, id: docId });

    const docs = getDocuments();
    expect(docs.get(docId)!.title).toBe("New Title");
  });

  it("allows shared user to update content", async () => {
    setMockUserId(editorId);
    const { updateDocument } = await import("@/app/documents/actions");

    const newContent = { type: "doc", content: [{ type: "paragraph" }] };
    const result = await updateDocument(docId, { content: newContent });
    expect(result).toEqual({ success: true, id: docId });

    const docs = getDocuments();
    expect(docs.get(docId)!.content).toEqual(newContent);
  });

  it("rejects empty title", async () => {
    const { updateDocument } = await import("@/app/documents/actions");

    const result = await updateDocument(docId, { title: "   " });
    expect(result).toEqual({
      success: false,
      error: "Title cannot be empty",
    });
  });

  it("rejects title over 200 characters", async () => {
    const { updateDocument } = await import("@/app/documents/actions");

    const result = await updateDocument(docId, { title: "x".repeat(201) });
    expect(result).toEqual({ success: false, error: "Title is too long" });
  });

  it("trims title whitespace", async () => {
    const { updateDocument } = await import("@/app/documents/actions");

    await updateDocument(docId, { title: "  Trimmed  " });
    const docs = getDocuments();
    expect(docs.get(docId)!.title).toBe("Trimmed");
  });

  it("denies access to uninvolved user", async () => {
    setMockUserId(strangerId);
    const { updateDocument } = await import("@/app/documents/actions");

    const result = await updateDocument(docId, { title: "Hacked" });
    expect(result).toEqual({ success: false, error: "Not authorized" });
  });
});

describe("deleteDocument", () => {
  let docId: string;

  beforeEach(async () => {
    const { createDocument } = await import("@/app/documents/actions");
    await createDocument().catch(() => {});
    docId = [...getDocuments().keys()][0];
  });

  it("allows owner to delete document", async () => {
    const { deleteDocument } = await import("@/app/documents/actions");

    const result = await deleteDocument(docId);
    expect(result).toEqual({ success: true, id: docId });

    const docs = getDocuments();
    expect(docs.has(docId)).toBe(false);
  });

  it("prevents non-owner from deleting document", async () => {
    setMockUserId(editorId);
    const { deleteDocument } = await import("@/app/documents/actions");

    const result = await deleteDocument(docId);
    expect(result).toEqual({ success: false, error: "Not authorized" });

    const docs = getDocuments();
    expect(docs.has(docId)).toBe(true);
  });
});

"use server";

import { auth } from "@/lib/auth";
import { parseFileContent } from "@/lib/parse-content";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type DocumentResult =
  | { success: true; id: string }
  | { success: false; error: string };

const DEFAULT_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

async function getDb() {
  const { getPrisma } = await import("@/lib/prisma");
  return getPrisma();
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function canAccessDocument(
  userId: string,
  documentId: string
): Promise<{ allowed: boolean; isOwner: boolean }> {
  const db = await getDb();

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!doc) return { allowed: false, isOwner: false };
  if (doc.ownerId === userId) return { allowed: true, isOwner: true };

  const share = await db.documentShare.findUnique({
    where: {
      documentId_userId: { documentId, userId },
    },
  });

  return { allowed: !!share, isOwner: false };
}

export async function createDocument(): Promise<DocumentResult> {
  const userId = await requireUser();
  const db = await getDb();

  const doc = await db.document.create({
    data: {
      title: "Untitled Document",
      content: DEFAULT_CONTENT,
      ownerId: userId,
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/${doc.id}`);
}

export async function updateDocument(
  documentId: string,
  data: { title?: string; content?: unknown }
): Promise<DocumentResult> {
  const userId = await requireUser();
  const { allowed } = await canAccessDocument(userId, documentId);
  if (!allowed) return { success: false, error: "Not authorized" };

  const db = await getDb();

  const updateData: { title?: string; content?: unknown } = {};

  if (data.title !== undefined) {
    const trimmed = data.title.trim();
    if (trimmed.length === 0)
      return { success: false, error: "Title cannot be empty" };
    if (trimmed.length > 200)
      return { success: false, error: "Title is too long" };
    updateData.title = trimmed;
  }

  if (data.content !== undefined) {
    updateData.content = data.content;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true, id: documentId };
  }

  await db.document.update({
    where: { id: documentId },
    data: updateData as Record<string, unknown>,
  });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  return { success: true, id: documentId };
}

export async function deleteDocument(
  documentId: string
): Promise<DocumentResult> {
  const userId = await requireUser();
  const db = await getDb();

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!doc || doc.ownerId !== userId) {
    return { success: false, error: "Not authorized" };
  }

  await db.document.delete({ where: { id: documentId } });
  revalidatePath("/documents");
  return { success: true, id: documentId };
}

export type ShareUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export async function getDocumentShares(
  documentId: string
): Promise<ShareUser[]> {
  const userId = await requireUser();
  const { allowed } = await canAccessDocument(userId, documentId);
  if (!allowed) return [];

  const db = await getDb();

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { owner: { select: { id: true, name: true, email: true } } },
  });

  if (!doc) return [];

  const shares = await db.documentShare.findMany({
    where: { documentId },
    select: {
      user: { select: { id: true, name: true, email: true } },
      role: true,
    },
  });

  return [
    { ...doc.owner, role: "OWNER" },
    ...shares.map((s) => ({ ...s.user, role: s.role })),
  ];
}

export async function addShare(
  documentId: string,
  email: string
): Promise<DocumentResult> {
  const userId = await requireUser();
  const db = await getDb();

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!doc || doc.ownerId !== userId) {
    return { success: false, error: "Only the owner can share" };
  }

  const targetUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!targetUser) {
    return { success: false, error: "No user found with that email" };
  }

  if (targetUser.id === userId) {
    return { success: false, error: "Cannot share with yourself" };
  }

  const existing = await db.documentShare.findUnique({
    where: {
      documentId_userId: { documentId, userId: targetUser.id },
    },
  });

  if (existing) {
    return { success: false, error: "Already shared with this user" };
  }

  await db.documentShare.create({
    data: {
      documentId,
      userId: targetUser.id,
      role: "EDITOR",
    },
  });

  revalidatePath(`/documents/${documentId}`);
  return { success: true, id: documentId };
}

export async function removeShare(
  documentId: string,
  targetUserId: string
): Promise<DocumentResult> {
  const userId = await requireUser();
  const db = await getDb();

  const doc = await db.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!doc || doc.ownerId !== userId) {
    return { success: false, error: "Only the owner can remove access" };
  }

  await db.documentShare.deleteMany({
    where: { documentId, userId: targetUserId },
  });

  revalidatePath(`/documents/${documentId}`);
  return { success: true, id: documentId };
}

const ALLOWED_EXTENSIONS = ["txt", "md"];
const MAX_FILE_SIZE = 1024 * 1024;

export async function importDocument(
  filename: string,
  text: string
): Promise<DocumentResult> {
  const userId = await requireUser();
  const db = await getDb();

  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { success: false, error: "Only .txt and .md files are supported" };
  }

  if (text.length > MAX_FILE_SIZE) {
    return { success: false, error: "File is too large (max 1 MB)" };
  }

  const title = filename.replace(/\.[^.]+$/, "");
  const jsonContent = parseFileContent(filename, text);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await db.document.create({
    data: {
      title,
      content: jsonContent as any,
      ownerId: userId,
    },
  });

  revalidatePath("/documents");
  redirect(`/documents/${doc.id}`);
}

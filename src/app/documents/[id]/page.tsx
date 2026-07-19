import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { DocumentHeader } from "./document-header";
import { DocumentEditor } from "./document-editor";
import { SharePanel } from "./share-panel";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const db = getPrisma();

  const doc = await db.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!doc) notFound();

  const isOwner = doc.ownerId === session.user.id;

  if (!isOwner) {
    const hasAccess = await db.documentShare.findUnique({
      where: {
        documentId_userId: {
          documentId: id,
          userId: session.user.id,
        },
      },
    });

    if (!hasAccess) notFound();
  }

  const shares = await db.documentShare.findMany({
    where: { documentId: id },
    select: {
      user: { select: { id: true, name: true, email: true } },
      role: true,
    },
  });

  const shareUsers = [
    { id: doc.owner.id, name: doc.owner.name, email: doc.owner.email, role: "OWNER" },
    ...shares.map((s) => ({
      id: s.user.id,
      name: s.user.name,
      email: s.user.email,
      role: s.role,
    })),
  ];

  const content = JSON.parse(JSON.stringify(doc.content));

  return (
    <div className="flex min-h-screen flex-col">
      <DocumentHeader
        documentId={doc.id}
        title={doc.title}
        isOwner={isOwner}
        ownerName={doc.owner.name}
        updatedAt={doc.updatedAt}
      />

      <main className="container mx-auto flex-1 px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <DocumentEditor
            documentId={doc.id}
            initialTitle={doc.title}
            initialContent={content}
            isOwner={isOwner}
          />

          <aside className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">Sharing</h3>
              <SharePanel
                documentId={doc.id}
                initialShares={shareUsers}
                isOwner={isOwner}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

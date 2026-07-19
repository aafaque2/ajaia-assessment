import { auth, signOut } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "./document-card";
import { CreateDocumentButton } from "./create-document-button";
import { ImportFileButton } from "./import-file-button";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const db = getPrisma();
  const [owned, shared] = await Promise.all([
    db.document.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
    db.document.findMany({
      where: {
        shares: { some: { userId: session.user.id } },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        owner: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Documents</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 space-y-8 px-4 py-8">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Documents</h2>
            <div className="flex items-center gap-2">
              <ImportFileButton />
              <CreateDocumentButton />
            </div>
          </div>
          {owned.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents yet. Create one to get started.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {owned.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  updatedAt={doc.updatedAt}
                  isOwner={true}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Shared With Me</h2>
          {shared.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents have been shared with you yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shared.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  updatedAt={doc.updatedAt}
                  owner={doc.owner}
                  isOwner={false}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

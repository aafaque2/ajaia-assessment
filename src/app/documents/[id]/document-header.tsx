import Link from "next/link";

interface DocumentHeaderProps {
  documentId: string;
  title: string;
  isOwner: boolean;
  ownerName: string;
  updatedAt: Date;
}

export function DocumentHeader({
  title,
  isOwner,
  ownerName,
  updatedAt,
}: DocumentHeaderProps) {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/documents"
            className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[0.8rem] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            &larr; Back
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-xs text-muted-foreground">
              {isOwner ? "You own this" : `Shared by ${ownerName}`} &middot;{" "}
              Updated {new Date(updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteDocument } from "@/app/documents/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DocumentCardProps {
  id: string;
  title: string;
  updatedAt: Date;
  owner?: { name: string; email: string };
  isOwner: boolean;
}

export function DocumentCard({
  id,
  title,
  updatedAt,
  owner,
  isOwner,
}: DocumentCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm("Delete this document?")) return;
    startTransition(() => { deleteDocument(id); });
  }

  return (
    <Link href={`/documents/${id}`} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="truncate text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {owner && !isOwner && (
                <span className="mr-2">Shared by {owner.name}</span>
              )}
              <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>
            </div>
            {isOwner && (
              <Button
                variant="destructive"
                size="xs"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "..." : "Delete"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

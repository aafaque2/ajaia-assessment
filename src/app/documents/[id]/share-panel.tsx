"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addShare,
  removeShare,
  type ShareUser,
} from "@/app/documents/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SharePanelProps {
  documentId: string;
  initialShares: ShareUser[];
  isOwner: boolean;
}

export function SharePanel({
  documentId,
  initialShares,
  isOwner,
}: SharePanelProps) {
  const router = useRouter();
  const [shares, setShares] = useState(initialShares);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setShares([]);
    router.refresh();
  }

  function handleAddShare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addShare(documentId, email.trim());
      if (result.success) {
        setEmail("");
        refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleRemoveShare(targetUserId: string) {
    startTransition(async () => {
      const result = await removeShare(documentId, targetUserId);
      if (result.success) {
        setShares((prev) => prev.filter((s) => s.id !== targetUserId));
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {shares.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{user.name}</span>
              <span className="ml-2 text-muted-foreground">{user.email}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({user.role})
              </span>
            </div>
            {isOwner && user.role !== "OWNER" && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleRemoveShare(user.id)}
                disabled={isPending}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <form onSubmit={handleAddShare} className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="user@example.com"
            required
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Share
          </Button>
        </form>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

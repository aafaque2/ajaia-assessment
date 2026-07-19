"use client";

import { useTransition } from "react";
import { createDocument } from "@/app/documents/actions";
import { Button } from "@/components/ui/button";

export function CreateDocumentButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => { createDocument(); })}
    >
      {isPending ? "Creating..." : "New Document"}
    </Button>
  );
}

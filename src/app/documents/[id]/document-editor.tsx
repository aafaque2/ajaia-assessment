"use client";

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDocument, deleteDocument } from "@/app/documents/actions";
import { jsonToMarkdown } from "@/lib/tiptap-to-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TipTapEditor, type TipTapEditorHandle } from "./tip-tap-editor";

interface DocumentEditorProps {
  documentId: string;
  initialTitle: string;
  initialContent: unknown;
  isOwner: boolean;
}

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  isOwner,
}: DocumentEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const editorRef = useRef<TipTapEditorHandle>(null);
  const contentRef = useRef<unknown>(initialContent);
  const titleRef = useRef(title);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const save = useCallback(
    async (titleToSave: string, contentToSave: unknown) => {
      setStatus("saving");
      setError(null);

      const result = await updateDocument(documentId, {
        title: titleToSave,
        content: contentToSave,
      });

      if (result.success) {
        setStatus("saved");
        setLastSaved(new Date());
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setError(result.error);
      }
    },
    [documentId]
  );

  const scheduleAutosave = useCallback(
    (contentToSave: unknown) => {
      contentRef.current = contentToSave;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        save(titleRef.current, contentRef.current);
      }, 2000);
    },
    [save]
  );

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  function handleContentUpdate(json: object) {
    scheduleAutosave(json);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    scheduleAutosave(contentRef.current);
  }

  async function handleSaveNow() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await save(title, contentRef.current);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSaveNow();
    }
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this document?")) return;
    startTransition(async () => {
      const result = await deleteDocument(documentId);
      if (result.success) {
        router.push("/documents");
      } else {
        setError(result.error);
      }
    });
  }

  function handleExportMarkdown() {
    const latestJson = editorRef.current?.getJson() ?? contentRef.current;
    const markdown = jsonToMarkdown(latestJson);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
      <div className="flex items-center gap-3">
        <Input
          value={title}
          onChange={handleTitleChange}
          className="text-lg font-semibold"
          placeholder="Document title"
        />
        <div className="flex items-center gap-2">
          {lastSaved && status !== "saving" && (
            <span className="text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {status === "saving" && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
            Export Markdown
          </Button>
          <Button size="sm" onClick={handleSaveNow} disabled={status === "saving"}>
            Save
          </Button>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>

      <TipTapEditor
        ref={editorRef}
        content={initialContent}
        onUpdate={handleContentUpdate}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

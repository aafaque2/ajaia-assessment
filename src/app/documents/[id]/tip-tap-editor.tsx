"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Toolbar } from "./toolbar";

const EMPTY_CONTENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export interface TipTapEditorHandle {
  getJson: () => object;
}

interface TipTapEditorProps {
  content: unknown;
  onUpdate: (json: object) => void;
  editable?: boolean;
}

export const TipTapEditor = forwardRef<TipTapEditorHandle, TipTapEditorProps>(
  function TipTapEditor({ content, onUpdate, editable = true }, ref) {
    const initial =
      content && typeof content === "object" && "type" in (content as object)
        ? content
        : EMPTY_CONTENT;

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2] },
        }),
        Underline,
        Placeholder.configure({
          placeholder: "Start writing...",
        }),
      ],
      content: initial,
      editable,
      onUpdate: ({ editor }) => {
        onUpdate(editor.getJSON());
      },
    });

    useImperativeHandle(ref, () => ({
      getJson: () => editor?.getJSON() ?? EMPTY_CONTENT,
    }));

    if (!editor) return null;

    return (
      <div className="flex flex-col gap-2">
        {editable && <Toolbar editor={editor} />}
        <div className="min-h-[50vh] rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring">
          <EditorContent
            editor={editor}
            className="tiptap-editor h-full"
          />
        </div>
      </div>
    );
  }
);

export { EMPTY_CONTENT };

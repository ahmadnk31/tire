"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ImageExtension } from "@/components/tiptap/extensions/image";
import { ImagePlaceholder } from "@/components/tiptap/extensions/image-placeholder";
import SearchAndReplace from "@/components/tiptap/extensions/search-and-replace";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, type Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "@/components/tiptap/toolbars/editor-toolbar";
import Placeholder from "@tiptap/extension-placeholder";
import "@/components/tiptap/tiptap.css";

interface RichTextAdapterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const extensions = [
  StarterKit.configure({
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal",
      },
    },
    bulletList: {
      HTMLAttributes: {
        class: "list-disc",
      },
    },
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  Placeholder.configure({
    emptyNodeClass: "is-editor-empty",
    placeholder: ({ node }) => {
      switch (node.type.name) {
        case "heading":
          return `Heading ${node.attrs.level}`;
        case "detailsSummary":
          return "Section title";
        case "codeBlock":
          return "";
        default:
          return "Write your newsletter content here...";
      }
    },
    includeChildren: false,
  }),
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Subscript,
  Superscript,
  Underline,
  Link,
  Color,
  Highlight.configure({
    multicolor: true,
  }),
  ImageExtension,
  ImagePlaceholder,
  SearchAndReplace,
  Typography,
];

export const RichTextAdapter = forwardRef<HTMLDivElement, RichTextAdapterProps>(
  function RichTextAdapter({ value, onChange, placeholder, className }, ref) {
    const editor = useEditor({
      extensions: extensions as Extension[],
      content: value,
      editorProps: {
        attributes: {
          class: "max-w-full focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    if (!editor) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden border bg-card",
          className
        )}
      >
        <EditorToolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="min-h-[250px] w-full cursor-text p-4"
        />
      </div>
    );
  }
);

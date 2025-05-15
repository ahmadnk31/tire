"use client";

import React from "react";
import { RichTextAdapter } from "@/components/tiptap/rich-text-adapter";

interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder, 
  className 
}: RichTextEditorProps) {
  return (
    <RichTextAdapter
      value={content}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  );
}

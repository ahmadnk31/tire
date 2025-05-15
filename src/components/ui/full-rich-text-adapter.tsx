'use client';

import React, { forwardRef, useState, useEffect } from "react";
import dynamic from 'next/dynamic';

// Dynamic import with ssr: false to prevent document not defined error
const ReactQuillEditor = dynamic(
  () => import("@/components/react-quill-editor").then((mod) => mod.ReactQuillEditor),
  { ssr: false }
);

// Import styles directly to ensure they're available
import '@/styles/quill-custom.css';

interface FullRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
}

export const FullRichTextEditor = forwardRef<HTMLDivElement, FullRichTextEditorProps>(
  function FullRichTextEditor({ value, onChange, placeholder, height, className }, ref) {
    // Create a stable editor identifier
    const editorId = React.useRef(`full-editor-${Math.random().toString(36).substring(2, 9)}`).current;
    
    // Use useState and useEffect to track client-side mounting
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
      setIsMounted(true);
      
      // Add a global click handler to ensure toolbar remains visible
      const handleDocumentClick = () => {
        const toolbar = document.querySelector('.full-rich-text-editor .ql-toolbar');
        if (toolbar && toolbar.classList.contains('ql-snow')) {
          toolbar.classList.add('visible-toolbar');
        }
      };
      
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }, []);

    // Define custom modules to ensure toolbar always shows and is correctly configured
    const customModules = {
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean']
        ]
      }
    };    
    // Use a stable callback to preserve focus during state changes
    const handleChange = React.useCallback((newValue: string) => {
      onChange(newValue);
    }, [onChange]);
    
    // Add focus handling
    const [hasFocus, setHasFocus] = useState(false);
    
    // Effect to apply focus classes to maintain toolbar visibility
    useEffect(() => {
      if (hasFocus) {
        const editorElement = document.getElementById(editorId);
        if (editorElement) {
          editorElement.classList.add('editor-focused');
        }
      }
    }, [hasFocus, editorId]);
    
    return (      <div 
        ref={ref} 
        style={{ height: height || '400px' }}
        id={editorId}
        className={`${hasFocus ? 'editor-has-focus' : ''} ${className || ''} rich-text-container`}
        onFocus={() => setHasFocus(true)}
        onBlur={() => {
          // Small delay to ensure we don't remove focus too soon
          // This helps prevent toolbar disappearing when clicking toolbar buttons
          setTimeout(() => setHasFocus(false), 500);
        }}
      >
        {isMounted ? (
          <ReactQuillEditor
            key={editorId}
            value={value || ''}
            setValue={handleChange}
            placeholder={placeholder}
            className={`${className || ""} full-rich-text-editor`}
            isEditable={true}
            customModules={customModules}
          />
        ) : (
          // Display a placeholder while the editor is loading
          <div className="h-full flex items-center justify-center border rounded-md bg-gray-50 text-gray-400">
            Loading editor...
          </div>
        )}
      </div>
    );
  }
);

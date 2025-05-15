'use client';

import React, { forwardRef, useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import '@/styles/quill-custom.css';

// Dynamic import with ssr: false to prevent document not defined error
const ReactQuillEditor = dynamic(
  () => import("@/components/react-quill-editor").then((mod) => mod.ReactQuillEditor),
  { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  hideToolbar?: boolean;
}

export const RichTextEditorAdapter = forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditorAdapter({ value, onChange, placeholder, height, hideToolbar = false }, ref) {
    // Create a stable editor key that doesn't depend on the content
    // Using a useRef to keep a stable identifier throughout component lifecycle
    const editorId = React.useRef(`editor-${Math.random().toString(36).substring(2, 9)}`).current;
      
    // Create custom modules configuration with proper toolbar settings
    const customModules = hideToolbar ? 
      { toolbar: false } : 
      {
        toolbar: {
          container: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        }
      };
    
    // Use useState and useEffect to track client-side mounting
    const [isMounted, setIsMounted] = useState(false);
    const [hasFocus, setHasFocus] = useState(false);
    
    useEffect(() => {
      setIsMounted(true);
      
      // Add a global click handler to ensure toolbar remains visible
      const handleDocumentClick = () => {
        const toolbar = document.querySelector('.simple-rich-text-editor .ql-toolbar');
        if (toolbar && toolbar.classList.contains('ql-snow')) {
          toolbar.classList.add('visible-toolbar');
        }
      };
      
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }, []);
    
    // Effect to apply focus classes to maintain toolbar visibility
    useEffect(() => {
      if (hasFocus) {
        const editorElement = document.getElementById(editorId);
        if (editorElement) {
          editorElement.classList.add('editor-focused');
        }
      }
    }, [hasFocus, editorId]);
    
    // Use a stable callback to preserve focus during state changes
    const handleChange = React.useCallback((newValue: string) => {
      onChange(newValue);
    }, [onChange]);    return (      <div 
        ref={ref} 
        style={{ height: height || '250px' }}
        id={editorId}
        className={`${hasFocus ? 'editor-has-focus' : ''} rich-text-container`}
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
            className={`h-full ${hideToolbar ? 'quill-no-toolbar' : 'simple-rich-text-editor'}`}
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

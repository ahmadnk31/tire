import React, { useMemo, useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Only import styles on client side to avoid SSR issues
const loadStyles = () => {
  // Using require instead of import to ensure they are only loaded client-side
  require('react-quill-new/dist/quill.snow.css');
  require('quill-image-uploader/dist/quill.imageUploader.min.css');
};


// Define props interface for the component
interface ReactQuillEditorProps {
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
  className?: string;
  isEditable?: boolean;
  onHTMLChange?: (htmlContent: string, plainText: string) => void;
  customModules?: Record<string, any>;
}

// Define a ref type that includes our custom methods
export interface ReactQuillEditorRef {
  getPlainText: () => string;
  getEditor: () => any;
}

export const ReactQuillEditor = forwardRef<ReactQuillEditorRef, ReactQuillEditorProps>(({ 
  value, 
  setValue, 
  placeholder = 'Write your content here...', 
  className = '',
  isEditable = true,
  onHTMLChange,
  customModules
}: ReactQuillEditorProps, ref) => {
  const { theme } = useTheme();
  const quillRef = useRef<any>(null);
  
  // Load styles on client side
  useEffect(() => {
    loadStyles();
  }, []);
    // Handle change and get both HTML and text content
  const handleChange = (content: string) => {
    // First check if editor is actually available (avoid any null/undefined errors)
    if (quillRef.current) {
      setValue(content);
      // If onHTMLChange prop is provided, call it with HTML content and plain text
      if (onHTMLChange) {
        const editor = quillRef.current?.getEditor();
        const plainText = editor ? editor.getText() : '';
        onHTMLChange(content, plainText);
      }
    } else {
      // If editor reference isn't available yet, schedule an update
      setTimeout(() => setValue(content), 0);
    }
  }
  
  /**
   * Gets the plain text content from the editor
   * Useful for generating plain text versions of HTML emails
   */  const getPlainText = (): string => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      return editor.getText() || '';
    }
    return '';
  }
    
  // Define a stable module configuration  
  const modules = useMemo(() => {
    // Default modules configuration that works with core Quill
    const config = {
      toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], // this matches Quill's internal names
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']      ],
      ...(customModules || {}), // Merge any custom modules provided
    };
    
    // If customModules contains a toolbar property, use it to replace the default toolbar
    if (customModules?.toolbar) {
      config.toolbar = customModules.toolbar;
    }
    
    return config;
  }, [customModules]);
  // Define formats that are allowed - only include core formats that are guaranteed to be registered
  
  // Fix the useImperativeHandle target - it should be the forwarded ref, not quillRef
  useImperativeHandle(ref, () => ({
    getPlainText,
    getEditor: () => quillRef.current?.getEditor()
  }));
  // Use try-catch to handle any Quill initialization errors
  const [hasError, setHasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Reset error state on component mount or value change
    setHasError(false);
    
    // Mark component as mounted (client-side)
    setIsMounted(true);
  }, [value]);
  
  // If there's an error or we're not mounted yet (server-side), show fallback
  if (hasError || !isMounted) {
    // Fallback to a simple textarea if Quill fails or during SSR
    return (
      <div className={`quill-fallback ${className}`}>
        <textarea
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', minHeight: '250px', padding: '10px' }}
          disabled={!isEditable}
        />
      </div>
    );
  }
    return (
    <div className={`quill-editor-container ${className}`}>
      <ReactQuill 
        ref={quillRef}
        theme="snow" 
        value={value} 
        readOnly={!isEditable}
        onChange={handleChange}
        modules={modules}
        placeholder={placeholder}
        style={{ minHeight: '250px' }}
        preserveWhitespace={true}
        bounds=".quill-editor-container"
        scrollingContainer=".quill-editor-container"
      />
    </div>
  );
});


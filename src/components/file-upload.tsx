import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { uploadFile } from "@/lib/utils/upload-helpers";
import Image from "next/image";

// Animation variants remain unchanged
const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

interface FileWithPreview extends File {
  preview: string;
}

interface UploadedFile {
  fileUrl: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface FileUploadProps {
  onChange?: (files: UploadedFile[]) => void;
  multiple?: boolean;
  value?: UploadedFile[];
  folder?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  onUploadProgress?: (progress: number) => void;
}

export const FileUpload = ({
  onChange,
  multiple = false,
  value = [],
  folder = "general",
  maxSize = 5, // Default to 5MB
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  onUploadProgress,
}: FileUploadProps) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(value || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set up file previews when component mounts or value changes
  useEffect(() => {
    if (value && value.length > 0) {
      setUploadedFiles(value);
    }
  }, [value]);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const handleFileChange = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    // Handle file size validation
    const oversizedFiles = acceptedFiles.filter(
      file => file.size > maxSize * 1024 * 1024
    );
    
    if (oversizedFiles.length > 0) {
      setError(`File size exceeds the ${maxSize}MB limit`);
      return;
    }
    
    // Handle file type validation
    const invalidTypeFiles = acceptedFiles.filter(
      file => !allowedTypes.includes(file.type)
    );
    
    if (invalidTypeFiles.length > 0) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }
    
    // Create preview for accepted files
    const filesWithPreview = acceptedFiles.map((file) => 
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
    
    // In single file mode, replace existing files
    const newFiles = multiple 
      ? [...files, ...filesWithPreview] 
      : filesWithPreview;
    
    setFiles(newFiles);
    
    // Start uploading the files
    setIsUploading(true);
    const progress = (percent: number) => {
      setUploadProgress(percent);
      if (onUploadProgress) onUploadProgress(percent);
    };
    
    try {
      // Upload files one by one, updating progress as we go
      const results: UploadedFile[] = [];
      
      for (let i = 0; i < filesWithPreview.length; i++) {
        const file = filesWithPreview[i];
        progress((i / filesWithPreview.length) * 90); // Up to 90%
        
        const result = await uploadFile(file, folder);
        
        // Convert to UploadedFile format
        const uploadedFile: UploadedFile = {
          fileUrl: result.fileUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        };
        
        results.push(uploadedFile);
      }
      
      // Update state with newly uploaded files
      const newUploadedFiles = multiple 
        ? [...uploadedFiles, ...results] 
        : results;
      
      setUploadedFiles(newUploadedFiles);
      setFiles([]); // Clear the local files now that they're uploaded
      
      // Notify parent component
      if (onChange) {
        onChange(newUploadedFiles);
      }
      
      progress(100); // Complete progress
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [files, uploadedFiles, multiple, folder, onChange, maxSize, allowedTypes, onUploadProgress]);

  const handleDelete = useCallback((index: number) => {
    // Delete from uploadedFiles state
    const newUploadedFiles = [...uploadedFiles];
    newUploadedFiles.splice(index, 1);
    setUploadedFiles(newUploadedFiles);
    
    // Notify parent component
    if (onChange) {
      onChange(newUploadedFiles);
    }
  }, [uploadedFiles, onChange]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (fileRejections) => {
      const errors = fileRejections.map(rejection => 
        rejection.errors.map(error => error.message).join(', ')
      );
      setError(errors.join('; '));
      console.error('File rejected:', fileRejections);
    },
  });

  const isImageFile = (type: string) => type.startsWith('image/');

  return (
    <div className="w-full">
      <div className="w-full" {...getRootProps()}>
        <motion.div
          onClick={handleClick}
          whileHover="animate"
          className="p-6 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
        >
          <input
            ref={fileInputRef}
            id="file-upload-handle"
            type="file"
            multiple={multiple}
            onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
            className="hidden"
            accept={allowedTypes.join(',')}
          />
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
            <GridPattern />
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
              Upload file{multiple ? 's' : ''}
            </p>
            <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-sm mt-2">
              Drag or drop your file{multiple ? 's' : ''} here or click to upload
            </p>
            {error && (
              <p className="relative z-20 font-sans text-sm text-red-500 mt-2">
                {error}
              </p>
            )}
            {isUploading && (
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mt-3">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            <div className="relative w-full mt-6 max-w-xl mx-auto">
              {/* Show files being uploaded (with local preview) */}
              {files.length > 0 &&
                files.map((file, idx) => (
                  <motion.div
                    key={`preview-${idx}`}
                    layoutId={`file-preview-${idx}`}
                    className={cn(
                      "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start p-4 mb-4 w-full mx-auto rounded-md",
                      "shadow-sm border border-gray-200 dark:border-gray-800"
                    )}
                  >
                    {isImageFile(file.type) && (
                      <div className="w-full h-40 relative mb-3 bg-gray-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                        <Image 
                          src={file.preview} 
                          alt={file.name}
                          className="object-contain"
                          fill
                        />
                      </div>
                    )}
                    <div className="flex justify-between w-full items-center gap-4">
                      <p className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                        {file.name} <span className="text-neutral-400">(Uploading...)</span>
                      </p>
                      <p className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </motion.div>
                ))}

              {/* Show successfully uploaded files */}
              {uploadedFiles.length > 0 &&
                uploadedFiles.map((file, idx) => (
                  <motion.div
                    key={`uploaded-${idx}`}
                    layoutId={`file-uploaded-${idx}`}
                    className={cn(
                      "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start p-4 mb-4 w-full mx-auto rounded-md",
                      "shadow-sm border border-gray-200 dark:border-gray-800"
                    )}
                  >
                    {isImageFile(file.type) && (
                      <div className="w-full h-40 relative mb-3 bg-gray-100 dark:bg-neutral-800 rounded-md overflow-hidden">
                        <Image 
                          src={file.fileUrl} 
                          alt={file.name}
                          className="object-contain"
                          fill
                        />
                      </div>
                    )}
                    <div className="flex justify-between w-full items-center gap-4">
                      <p className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(idx);
                          }}
                          className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                          aria-label="Delete file"
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex text-sm flex-row items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                      <p className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800">
                        {file.type}
                      </p>
                      {file.lastModified && (
                        <p>
                          modified {new Date(file.lastModified).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}

              {!files.length && !uploadedFiles.length && (
                <>
                  <motion.div
                    layoutId="file-upload"
                    variants={mainVariant}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className={cn(
                      "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                      "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    {isDragActive ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-neutral-600 flex flex-col items-center"
                      >
                        Drop it
                        <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                      </motion.p>
                    ) : (
                      <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                    )}
                  </motion.div>

                  <motion.div
                    variants={secondaryVariant}
                    className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                  ></motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}

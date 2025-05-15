import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadProps {
  onUpload?: (url: string) => void;
  folder?: string; // Optional folder path within the S3 bucket
  maxSizeMB?: number; // Optional max file size in MB
  allowedFileTypes?: string[]; // Optional allowed file MIME types
}

export function useImageUpload({ 
  onUpload, 
  folder = 'uploads', 
  maxSizeMB = 5,
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}: UseImageUploadProps = {}) {
  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Upload function that uses AWS S3 through our API endpoint
  const uploadToS3 = async (file: File, localUrl: string): Promise<string> => {
    try {
      setUploading(true);
      setProgress(0);

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSizeMB) {
        throw new Error(`File size exceeds the ${maxSizeMB}MB limit`);
      }
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Simulating upload progress with intervals
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 10;
          const nextProgress = Math.min(prev + increment, 95);
          return nextProgress;
        });
      }, 300);

      // Upload to server
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      setError(null);
      
      return data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
          setError(`Invalid file type. Allowed types: ${allowedFileTypes.join(', ')}`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        setFileName(file.name);
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
        previewRef.current = localUrl;

        try {
          // Upload to S3
          const uploadedUrl = await uploadToS3(file, localUrl);
          onUpload?.(uploadedUrl);
        } catch (err) {
          URL.revokeObjectURL(localUrl);
          setPreviewUrl(null);
          setFileName(null);
          return console.error(err);
        }
      }
    },
    [onUpload, uploadToS3, maxSizeMB, allowedFileTypes]
  );

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileName(null);
    previewRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
    uploading,
    progress,
    error,
  };
}

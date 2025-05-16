import { useCallback, useState, useRef } from "react";

interface UseFileUploadProps {
  onUpload?: (url: string, fileName: string) => void;
  maxSizeMB?: number;
  allowedFileTypes?: string[];
}

export function useFileUpload({
  onUpload,
  maxSizeMB = 5,
  allowedFileTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
}: UseFileUploadProps = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploaded, setUploaded] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
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
      setUploaded(true);
      setFileUrl(data.url);
      
      return data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      setUploaded(false);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validate file type
        if (allowedFileTypes.length > 0 && !allowedFileTypes.includes(file.type)) {
          setError(`Invalid file type. Allowed types include PDF, DOC, DOCX, TXT and images.`);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        setFileName(file.name);

        try {
          // Upload file
          const uploadedUrl = await uploadFile(file);
          if (onUpload) {
            onUpload(uploadedUrl, file.name);
          }
        } catch (err) {
          return console.error(err);
        }
      }
    },
    [onUpload, uploadFile, allowedFileTypes]
  );

  const handleRemove = useCallback(() => {
    setFileName(null);
    setFileUrl(null);
    setUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError(null);
    if (onUpload) {
      onUpload('', '');
    }
  }, [onUpload]);

  return {
    fileUrl,
    fileName,
    fileInputRef,
    handleButtonClick,
    handleFileChange,
    handleRemove,
    uploading,
    progress,
    error,
    uploaded
  };
}

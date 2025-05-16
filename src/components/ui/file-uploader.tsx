"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileUpload?: (url: string, fileName: string) => void;
  value?: string;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
  buttonText?: string;
  hintText?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export function FileUploader({
  onFileUpload,
  value,
  maxSizeMB = 5,
  accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
  className,
  buttonText = 'Upload Document',
  hintText = 'PDF, DOC, DOCX, TXT or images up to 5MB',
  variant = 'outline'
}: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds the ${maxSizeMB}MB limit`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFileName(file.name);
    setError(null);
    setUploading(true);
    setProgress(0);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
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
      
      if (onFileUpload) {
        onFileUpload(data.url, file.name);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      setUploaded(false);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = () => {
    setFileName(null);
    setUploaded(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileUpload) {
      onFileUpload('', '');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Button 
          type="button"
          variant={variant}
          onClick={handleButtonClick} 
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {buttonText}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">{hintText}</p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm truncate">{fileName}</span>
          </div>
          <Progress value={progress} className="h-1 w-full" />
          <p className="text-xs text-muted-foreground">Uploading... {Math.round(progress)}%</p>
        </div>
      )}

      {uploaded && fileName && !uploading && (
        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm truncate">{fileName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive rounded-md border border-destructive p-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}

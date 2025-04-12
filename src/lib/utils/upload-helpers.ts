/**
 * Client-side utility for uploading files to AWS S3 via our API
 */

/**
 * Upload a file to AWS S3 through the API
 * @param file The file to upload
 * @param folder Optional folder path (default: 'general')
 * @returns Promise with the uploaded file URL and key
 */
export async function uploadFile(file: File, folder: string = 'general'): Promise<{ fileUrl: string, key: string }> {
  if (!file) {
    throw new Error('No file provided');
  }
  
  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  // Upload file via API
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file');
  }
  
  return await response.json();
}

/**
 * Upload multiple files to AWS S3 through the API
 * @param files Array of files to upload
 * @param folder Optional folder path (default: 'general')
 * @returns Promise with array of uploaded file URLs and keys
 */
export async function uploadMultipleFiles(
  files: File[], 
  folder: string = 'general'
): Promise<Array<{ fileUrl: string, key: string }>> {
  if (!files.length) {
    throw new Error('No files provided');
  }
  
  // Upload all files in parallel
  const uploadPromises = files.map(file => uploadFile(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Upload an image file with preview generation
 * @param file The image file to upload
 * @param folder Optional folder path (default: 'images')
 * @param onProgress Optional progress callback
 * @returns Promise with the uploaded file URL, key, and preview URL
 */
export async function uploadImage(
  file: File, 
  folder: string = 'images',
  onProgress?: (progress: number) => void
): Promise<{ fileUrl: string, key: string, previewUrl: string }> {
  // Validate that file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File is not an image');
  }
  
  // Create a preview URL for the image
  const previewUrl = URL.createObjectURL(file);
  
  // Call progress callback with 0% if provided
  if (onProgress) {
    onProgress(0);
  }
  
  try {
    // Simulate progress (since fetch doesn't provide upload progress)
    if (onProgress) {
      const interval = setInterval(() => {
        onProgress(Math.floor(Math.random() * 90) + 10);
      }, 500);
      
      // Upload the file
      const result = await uploadFile(file, folder);
      
      // Clear the interval and set progress to 100%
      clearInterval(interval);
      onProgress(100);
      
      return {
        ...result,
        previewUrl
      };
    } else {
      // Upload without progress tracking
      const result = await uploadFile(file, folder);
      return {
        ...result,
        previewUrl
      };
    }
  } catch (error) {
    // Revoke the preview URL to avoid memory leaks
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}
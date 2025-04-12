import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3-client';

const bucketName = process.env.S3_BUCKET_NAME || '';

/**
 * Upload a file to S3
 * @param file The file buffer to upload
 * @param key The key (path) to store the file under in S3
 * @param contentType The MIME type of the file
 */
export async function uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  // Return the URL to the uploaded file
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Get a file from S3
 * @param key The key (path) of the file in S3
 */
export async function getFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  // Stream to buffer
  const chunks: Uint8Array[] = [];
  const stream = response.Body as ReadableStream<Uint8Array>;
  const reader = stream.getReader();
  
  let done = false;
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    if (value) {
      chunks.push(value);
    }
  }
  
  return Buffer.concat(chunks);
}

/**
 * Delete a file from S3
 * @param key The key (path) of the file in S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
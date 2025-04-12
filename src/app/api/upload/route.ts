import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/aws/s3-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'general';

    // Validate the file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${uniqueFilename}`;

    // Upload to S3
    const fileUrl = await uploadFile(fileBuffer, key, file.type);

    // Return success response with the file URL
    return NextResponse.json({ fileUrl, key });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}
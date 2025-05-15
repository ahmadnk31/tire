import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { uploadFile } from "@/lib/aws/s3-utils";
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Limit file size to 10MB
    },
  },
};

/**
 * API route for handling file uploads
 */
export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file as buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    // Create path for the file
    const folderPath = `uploads/${new Date().toISOString().split('T')[0]}`;
    const filePath = `${folderPath}/${uniqueFileName}`;
    
    // Upload to S3
    const fileUrl = await uploadFile(
      buffer,
      filePath,
      file.type
    );
    
    return NextResponse.json({ 
      success: true,
      url: fileUrl,
      fileName: file.name,
      contentType: file.type,
    });
    
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error.message || "File upload failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sendEmail } from '@/lib/aws/ses-utils';

// Retailer application schema validation
const retailerRequestSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  businessAddress: z.string().min(5, 'Business address must be at least 5 characters'),
  taxId: z.string().optional(),
  yearsInBusiness: z.string(),
  additionalInfo: z.string().optional(),
  businessDocument: z.string().optional(),
  businessDocumentName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const result = retailerRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      );
    }
      const { 
      name, 
      email, 
      companyName, 
      phone, 
      businessAddress, 
      taxId, 
      yearsInBusiness, 
      additionalInfo, 
      businessDocument, 
      businessDocumentName 
    } = result.data;
    
    // Check if an application with this email already exists
    const existingRequest = await prisma.retailerRequest.findFirst({
      where: {
        email,
        status: 'PENDING',
      },
    });
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'An application with this email is already pending review' },
        { status: 409 }
      );
    }
    
    // Create the retailer request
    const retailerRequest = await prisma.retailerRequest.create({
      data: {
        name,
        email,
        companyName,
        phone,
        businessAddress,
        taxId,
        yearsInBusiness,
        additionalInfo,
        businessDocument,
        businessDocumentName,
      },
    });
    
    // Send confirmation email to the applicant
    try {
      const subject = 'Tire Shop Retailer Application Received';
      const htmlBody = `
        <html>
          <body>
            <h1>We've Received Your Retailer Application</h1>
            <p>Dear ${name},</p>
            <p>Thank you for applying to become a registered retailer with Tire Shop. We have received your application for ${companyName}.</p>
            <p>Our team will review your application and get back to you within 2-3 business days.</p>
            <p>If you have any questions in the meantime, please feel free to contact our support team.</p>
            <p>Best regards,<br>The Tire Shop Team</p>
          </body>
        </html>
      `;
      const textBody = `
        We've Received Your Retailer Application
        
        Dear ${name},
        
        Thank you for applying to become a registered retailer with Tire Shop. We have received your application for ${companyName}.
        
        Our team will review your application and get back to you within 2-3 business days.
        
        If you have any questions in the meantime, please feel free to contact our support team.
        
        Best regards,
        The Tire Shop Team
      `;
      
      await sendEmail(email, subject, htmlBody, textBody);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue even if email fails
    }
    
    // Notify admin about new retailer request
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourtirestore.com';
      const subject = 'New Retailer Application';      const htmlBody = `
        <html>
          <body>
            <h1>New Retailer Application Received</h1>
            <p>A new retailer application has been submitted by ${name} from ${companyName}.</p>
            <p>Please review the application in the admin dashboard.</p>
            <h2>Application Details:</h2>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Company:</strong> ${companyName}</li>
              <li><strong>Phone:</strong> ${phone}</li>
              <li><strong>Address:</strong> ${businessAddress}</li>
              <li><strong>Years in Business:</strong> ${yearsInBusiness}</li>
              ${taxId ? `<li><strong>Tax ID:</strong> ${taxId}</li>` : ''}
              ${additionalInfo ? `<li><strong>Additional Info:</strong> ${additionalInfo}</li>` : ''}
              ${businessDocument ? `<li><strong>Business Document:</strong> <a href="${businessDocument}">${businessDocumentName || 'View Document'}</a></li>` : ''}
            </ul>
          </body>
        </html>
      `;      const textBody = `
        New Retailer Application Received
        
        A new retailer application has been submitted by ${name} from ${companyName}.
        
        Please review the application in the admin dashboard.
        
        Application Details:
        - Name: ${name}
        - Email: ${email}
        - Company: ${companyName}
        - Phone: ${phone}
        - Address: ${businessAddress}
        - Years in Business: ${yearsInBusiness}
        ${taxId ? `- Tax ID: ${taxId}` : ''}
        ${additionalInfo ? `- Additional Info: ${additionalInfo}` : ''}
        ${businessDocument ? `- Business Document: ${businessDocument}` : ''}
      `;
      
      await sendEmail(adminEmail, subject, htmlBody, textBody);
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Continue even if email fails
    }
    
    return NextResponse.json(
      {
        message: 'Retailer application submitted successfully',
        requestId: retailerRequest.id
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Retailer application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit retailer application' },
      { status: 500 }
    );
  }
}
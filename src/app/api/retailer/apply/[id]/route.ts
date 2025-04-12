import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { sendEmail } from '@/lib/aws/ses-utils';
import { hash } from 'bcryptjs';

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const body = await request.json();
    const { status, password } = body;
    
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Check if retailer request exists
    const retailerRequest = await prisma.retailerRequest.findUnique({
      where: { id }
    });
    
    if (!retailerRequest) {
      return NextResponse.json(
        { error: 'Retailer request not found' },
        { status: 404 }
      );
    }
    
    // Update the retailer request status
    const updatedRequest = await prisma.retailerRequest.update({
      where: { id },
      data: { status }
    });
    
    // If approved, create a retailer user account
    if (status === 'APPROVED') {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required for approval' },
          { status: 400 }
        );
      }
      
      // Hash the password
      const hashedPassword = await hash(password, 12);
      
      // Check if user with email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: retailerRequest.email }
      });
      
      let user;
      
      if (existingUser) {
        // Update existing user to retailer role
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'RETAILER',
            retailerProfile: {
              create: {
                companyName: retailerRequest.companyName,
                phone: retailerRequest.phone,
                businessAddress: retailerRequest.businessAddress,
                taxId: retailerRequest.taxId,
                yearsInBusiness: retailerRequest.yearsInBusiness,
              }
            }
          }
        });
      } else {
        // Create new retailer user
        user = await prisma.user.create({
          data: {
            name: retailerRequest.name,
            email: retailerRequest.email,
            password: hashedPassword,
            role: 'RETAILER',
            retailerProfile: {
              create: {
                companyName: retailerRequest.companyName,
                phone: retailerRequest.phone,
                businessAddress: retailerRequest.businessAddress,
                taxId: retailerRequest.taxId,
                yearsInBusiness: retailerRequest.yearsInBusiness,
              }
            }
          }
        });
      }
      
      // Send approval email to the applicant
      try {
        const subject = 'Your Retailer Application Has Been Approved';
        const htmlBody = `
          <html>
            <body>
              <h1>Congratulations! Your Retailer Application is Approved</h1>
              <p>Dear ${retailerRequest.name},</p>
              <p>We're pleased to inform you that your application for ${retailerRequest.companyName} to become a registered retailer with Tire Shop has been approved.</p>
              <p>You can now log in to your retailer account at <a href="${process.env.NEXTAUTH_URL}/login">our website</a> using:</p>
              <ul>
                <li>Email: ${retailerRequest.email}</li>
                <li>Password: The password provided by the administrator</li>
              </ul>
              <p>As a retailer, you'll have access to:</p>
              <ul>
                <li>Wholesale pricing on all products</li>
                <li>Bulk ordering capabilities</li>
                <li>Dedicated retailer support</li>
              </ul>
              <p>If you have any questions, please contact our retailer support team.</p>
              <p>Best regards,<br>The Tire Shop Team</p>
            </body>
          </html>
        `;
        const textBody = `
          Congratulations! Your Retailer Application is Approved
          
          Dear ${retailerRequest.name},
          
          We're pleased to inform you that your application for ${retailerRequest.companyName} to become a registered retailer with Tire Shop has been approved.
          
          You can now log in to your retailer account at ${process.env.NEXTAUTH_URL}/login using:
          - Email: ${retailerRequest.email}
          - Password: The password provided by the administrator
          
          As a retailer, you'll have access to:
          - Wholesale pricing on all products
          - Bulk ordering capabilities
          - Dedicated retailer support
          
          If you have any questions, please contact our retailer support team.
          
          Best regards,
          The Tire Shop Team
        `;
        
        await sendEmail(retailerRequest.email, subject, htmlBody, textBody);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Continue even if email fails
      }
    } else if (status === 'REJECTED') {
      // Send rejection email to the applicant
      try {
        const subject = 'Update on Your Retailer Application';
        const htmlBody = `
          <html>
            <body>
              <h1>Retailer Application Status Update</h1>
              <p>Dear ${retailerRequest.name},</p>
              <p>Thank you for your interest in becoming a registered retailer with Tire Shop.</p>
              <p>After careful review of your application for ${retailerRequest.companyName}, we regret to inform you that we are unable to approve your retailer account at this time.</p>
              <p>This decision may be due to one or more of the following reasons:</p>
              <ul>
                <li>Incomplete or insufficient business information</li>
                <li>Business type not aligned with our retailer program</li>
                <li>Geographical location outside our retailer service area</li>
              </ul>
              <p>You are welcome to reapply after 90 days with updated information.</p>
              <p>If you have any questions about your application or our decision, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>The Tire Shop Team</p>
            </body>
          </html>
        `;
        const textBody = `
          Retailer Application Status Update
          
          Dear ${retailerRequest.name},
          
          Thank you for your interest in becoming a registered retailer with Tire Shop.
          
          After careful review of your application for ${retailerRequest.companyName}, we regret to inform you that we are unable to approve your retailer account at this time.
          
          This decision may be due to one or more of the following reasons:
          - Incomplete or insufficient business information
          - Business type not aligned with our retailer program
          - Geographical location outside our retailer service area
          
          You are welcome to reapply after 90 days with updated information.
          
          If you have any questions about your application or our decision, please don't hesitate to contact our support team.
          
          Best regards,
          The Tire Shop Team
        `;
        
        await sendEmail(retailerRequest.email, subject, htmlBody, textBody);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Continue even if email fails
      }
    }
    
    return NextResponse.json({
      message: `Retailer application ${status.toLowerCase()} successfully`,
      request: updatedRequest
    });
    
  } catch (error) {
    console.error('Error processing retailer application:', error);
    return NextResponse.json(
      { error: 'Failed to process retailer application' },
      { status: 500 }
    );
  }
}
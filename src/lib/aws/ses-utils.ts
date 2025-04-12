import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from './ses-client';
import { format } from 'date-fns';

const fromEmail = process.env.SES_FROM_EMAIL || 'no-reply@yourtirestore.com';

/**
 * Send an email using AWS SES
 * @param to Recipient email address
 * @param subject Email subject
 * @param htmlBody HTML content of the email
 * @param textBody Plain text content of the email
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<void> {
  const toAddresses = Array.isArray(to) ? to : [to];

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  await sesClient.send(command);
}

/**
 * Send a welcome email to a new user
 * @param to Recipient email address
 * @param name User's name
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const subject = 'Welcome to Tire Shop';
  const htmlBody = `
    <html>
      <body>
        <h1>Welcome to Tire Shop!</h1>
        <p>Hello ${name},</p>
        <p>Thank you for creating an account with Tire Shop. We're excited to have you join our community.</p>
        <p>With your new account, you can:</p>
        <ul>
          <li>Browse our extensive tire catalog</li>
          <li>Book service appointments</li>
          <li>Track your orders</li>
          <li>Access exclusive deals and promotions</li>
        </ul>
        <p>If you have any questions or need assistance, please don't hesitate to contact our customer support team.</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Welcome to Tire Shop!
    
    Hello ${name},
    
    Thank you for creating an account with Tire Shop. We're excited to have you join our community.
    
    With your new account, you can:
    - Browse our extensive tire catalog
    - Book service appointments
    - Track your orders
    - Access exclusive deals and promotions
    
    If you have any questions or need assistance, please don't hesitate to contact our customer support team.
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send an order confirmation email
 * @param to Recipient email address
 * @param name User's name
 * @param orderNumber Order number
 * @param orderTotal Order total amount
 */
export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderNumber: string,
  orderTotal: number
): Promise<void> {
  const subject = `Order Confirmation #${orderNumber}`;
  const htmlBody = `
    <html>
      <body>
        <h1>Your Order is Confirmed</h1>
        <p>Hello ${name},</p>
        <p>Thank you for your order. We're pleased to confirm that we've received your order #${orderNumber}.</p>
        <p><strong>Order Total:</strong> $${orderTotal.toFixed(2)}</p>
        <p>You will receive another email when your order ships.</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Your Order is Confirmed
    
    Hello ${name},
    
    Thank you for your order. We're pleased to confirm that we've received your order #${orderNumber}.
    
    Order Total: $${orderTotal.toFixed(2)}
    
    You will receive another email when your order ships.
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send a password reset email
 * @param to Recipient email address
 * @param name User's name
 * @param resetToken Password reset token
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const htmlBody = `
    <html>
      <body>
        <h1>Password Reset Request</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>The link will expire in 1 hour.</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Password Reset Request
    
    Hello ${name},
    
    We received a request to reset your password. Visit the following link to reset it:
    ${resetUrl}
    
    If you didn't request this, please ignore this email.
    The link will expire in 1 hour.
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send an email verification email
 * @param to Recipient email address
 * @param name User's name
 * @param verificationToken Verification token
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationToken: string
): Promise<void> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
  const subject = 'Verify Your Email Address';
  const htmlBody = `
    <html>
      <body>
        <h1>Verify Your Email Address</h1>
        <p>Hello ${name},</p>
        <p>Thank you for registering with Tire Shop. Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">Verify Email Address</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Verify Your Email Address
    
    Hello ${name},
    
    Thank you for registering with Tire Shop. Please verify your email address by visiting the following link:
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send an invoice email
 * @param to Recipient email address
 * @param name Customer's name
 * @param orderNumber Order number
 * @param orderDate Date of the order
 * @param invoiceHtml HTML content of the invoice
 */
export async function sendInvoiceEmail(
  to: string,
  name: string,
  orderNumber: string,
  orderDate: string,
  invoiceHtml: string
): Promise<void> {
  const subject = `Invoice for Order #${orderNumber}`;
  
  // Email wrapper HTML
  const htmlBody = `
    <html>
      <body>
        <h1>Your Invoice</h1>
        <p>Hello ${name},</p>
        <p>Thank you for your order. Please find your invoice attached below.</p>
        <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
          ${invoiceHtml}
        </div>
        <p>If you have any questions about your order, please contact our customer service.</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Your Invoice for Order #${orderNumber}
    
    Hello ${name},
    
    Thank you for your order #${orderNumber} from ${orderDate}.
    
    Please log in to your account to view your invoice online.
    
    If you have any questions about your order, please contact our customer service.
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send an appointment confirmation email
 * @param to Recipient email address
 * @param name Customer's name
 * @param appointmentId Appointment ID
 * @param appointmentDate Date of the appointment
 * @param appointmentTime Time of the appointment
 * @param serviceType Type of service
 * @param duration Duration of the appointment in minutes
 */
export async function sendAppointmentConfirmationEmail(
  to: string,
  name: string,
  appointmentId: string,
  appointmentDate: Date,
  appointmentTime: string,
  serviceType: string,
  duration: number
): Promise<void> {
  const formattedDate = format(new Date(appointmentDate), 'MMMM d, yyyy');
  const appointmentUrl = `${process.env.NEXTAUTH_URL}/appointments/${appointmentId}`;
  
  // Format service type to be more readable
  const readableServiceType = serviceType
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const subject = 'Your Appointment Confirmation';
  const htmlBody = `
    <html>
      <body>
        <h1>Appointment Confirmed</h1>
        <p>Hello ${name},</p>
        <p>We're pleased to confirm your appointment for <strong>${readableServiceType}</strong>.</p>
        <p><strong>Date:</strong> ${formattedDate}<br>
        <strong>Time:</strong> ${appointmentTime}<br>
        <strong>Duration:</strong> ${duration} minutes</p>
        <p>Please arrive 10-15 minutes before your scheduled time.</p>
        <p>You can view your appointment details and make changes by <a href="${appointmentUrl}">clicking here</a>.</p>
        <p>If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        <p>We look forward to seeing you!</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Appointment Confirmed
    
    Hello ${name},
    
    We're pleased to confirm your appointment for ${readableServiceType}.
    
    Date: ${formattedDate}
    Time: ${appointmentTime}
    Duration: ${duration} minutes
    
    Please arrive 10-15 minutes before your scheduled time.
    
    You can view your appointment details and make changes by visiting:
    ${appointmentUrl}
    
    If you need to reschedule or cancel, please do so at least 24 hours in advance.
    
    We look forward to seeing you!
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send an appointment reminder email
 * @param to Recipient email address
 * @param name Customer's name
 * @param appointmentId Appointment ID
 * @param appointmentDate Date of the appointment
 * @param appointmentTime Time of the appointment
 * @param serviceType Type of service
 */
export async function sendAppointmentReminderEmail(
  to: string,
  name: string,
  appointmentId: string,
  appointmentDate: Date,
  appointmentTime: string,
  serviceType: string
): Promise<void> {
  const formattedDate = format(new Date(appointmentDate), 'MMMM d, yyyy');
  const appointmentUrl = `${process.env.NEXTAUTH_URL}/appointments/${appointmentId}`;
  
  // Format service type to be more readable
  const readableServiceType = serviceType
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  const subject = 'Appointment Reminder - Tomorrow';
  const htmlBody = `
    <html>
      <body>
        <h1>Appointment Reminder</h1>
        <p>Hello ${name},</p>
        <p>This is a friendly reminder about your upcoming appointment:</p>
        <p><strong>Service:</strong> ${readableServiceType}<br>
        <strong>Date:</strong> ${formattedDate}<br>
        <strong>Time:</strong> ${appointmentTime}</p>
        <p>Please arrive 10-15 minutes before your scheduled time.</p>
        <p>You can view your appointment details or make changes by <a href="${appointmentUrl}">clicking here</a>.</p>
        <p>If you need to reschedule or cancel, please do so as soon as possible.</p>
        <p>We look forward to seeing you tomorrow!</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Appointment Reminder
    
    Hello ${name},
    
    This is a friendly reminder about your upcoming appointment:
    
    Service: ${readableServiceType}
    Date: ${formattedDate}
    Time: ${appointmentTime}
    
    Please arrive 10-15 minutes before your scheduled time.
    
    You can view your appointment details or make changes by visiting:
    ${appointmentUrl}
    
    If you need to reschedule or cancel, please do so as soon as possible.
    
    We look forward to seeing you tomorrow!
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send an appointment status change email
 * @param to Recipient email address
 * @param name Customer's name
 * @param appointmentId Appointment ID
 * @param appointmentDate Date of the appointment
 * @param appointmentTime Time of the appointment
 * @param serviceType Type of service
 * @param status New status of the appointment
 */
export async function sendAppointmentStatusChangeEmail(
  to: string,
  name: string,
  appointmentId: string,
  appointmentDate: Date,
  appointmentTime: string,
  serviceType: string,
  status: string
): Promise<void> {
  const formattedDate = format(new Date(appointmentDate), 'MMMM d, yyyy');
  const appointmentUrl = `${process.env.NEXTAUTH_URL}/appointments/${appointmentId}`;
  
  // Format service type to be more readable
  const readableServiceType = serviceType
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Format status to be more readable
  const readableStatus = status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
  
  const subject = `Appointment Update - Status: ${readableStatus}`;
  
  let statusMessage = '';
  switch (status) {
    case 'CONFIRMED':
      statusMessage = 'Your appointment has been confirmed. We look forward to seeing you on the scheduled date and time.';
      break;
    case 'CANCELLED':
      statusMessage = 'Your appointment has been cancelled. If this was not requested by you, please contact us.';
      break;
    case 'COMPLETED':
      statusMessage = 'Thank you for visiting us. Your appointment has been marked as completed. We hope you were satisfied with our service.';
      break;
    case 'NO_SHOW':
      statusMessage = 'Our records show that you did not arrive for your scheduled appointment. If this is an error or if you would like to reschedule, please contact us.';
      break;
    default:
      statusMessage = `Your appointment status has been updated to: ${readableStatus}.`;
  }
  
  const htmlBody = `
    <html>
      <body>
        <h1>Appointment Status Update</h1>
        <p>Hello ${name},</p>
        <p>${statusMessage}</p>
        <p><strong>Service:</strong> ${readableServiceType}<br>
        <strong>Date:</strong> ${formattedDate}<br>
        <strong>Time:</strong> ${appointmentTime}<br>
        <strong>New Status:</strong> ${readableStatus}</p>
        <p>You can view your appointment details by <a href="${appointmentUrl}">clicking here</a>.</p>
        <p>If you have any questions, please contact our customer service.</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Appointment Status Update
    
    Hello ${name},
    
    ${statusMessage}
    
    Service: ${readableServiceType}
    Date: ${formattedDate}
    Time: ${appointmentTime}
    New Status: ${readableStatus}
    
    You can view your appointment details by visiting:
    ${appointmentUrl}
    
    If you have any questions, please contact our customer service.
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}

/**
 * Send an order cancellation confirmation email
 * @param to Recipient email address
 * @param name User's name
 * @param orderNumber Order number
 * @param cancellationReason Optional reason for cancellation
 * @param cancellationDate Date of the cancellation
 */
export async function sendOrderCancellationEmail(
  to: string,
  name: string,
  orderNumber: string,
  cancellationReason?: string,
  cancellationDate: Date = new Date()
): Promise<void> {
  const formattedDate = format(cancellationDate, 'MMMM d, yyyy');
  const formattedTime = format(cancellationDate, 'h:mm a');
  
  const subject = `Order #${orderNumber} Cancellation Confirmation`;
  const htmlBody = `
    <html>
      <body>
        <h1>Your Order Has Been Cancelled</h1>
        <p>Hello ${name},</p>
        <p>This email confirms that your order #${orderNumber} has been cancelled as requested on ${formattedDate} at ${formattedTime}.</p>
        ${cancellationReason ? `<p><strong>Reason:</strong> ${cancellationReason}</p>` : ''}
        <p>If this cancellation was made in error or you did not request it, please contact our customer support immediately.</p>
        <p>Any payment made for this order will be refunded according to our refund policy, typically within 5-7 business days.</p>
        <p>Have questions about your cancellation?</p>
        <ul>
          <li>Email us at support@tireshop.com</li>
          <li>Call us at (555) 123-4567</li>
          <li>Visit your account to view your order history</li>
        </ul>
        <p>We hope to serve you again in the future.</p>
        <p>Best regards,<br>The Tire Shop Team</p>
      </body>
    </html>
  `;
  
  const textBody = `
    Your Order Has Been Cancelled
    
    Hello ${name},
    
    This email confirms that your order #${orderNumber} has been cancelled as requested on ${formattedDate} at ${formattedTime}.
    ${cancellationReason ? `\nReason: ${cancellationReason}` : ''}
    
    If this cancellation was made in error or you did not request it, please contact our customer support immediately.
    
    Any payment made for this order will be refunded according to our refund policy, typically within 5-7 business days.
    
    Have questions about your cancellation?
    - Email us at support@tireshop.com
    - Call us at (555) 123-4567
    - Visit your account to view your order history
    
    We hope to serve you again in the future.
    
    Best regards,
    The Tire Shop Team
  `;

  await sendEmail(to, subject, htmlBody, textBody);
}
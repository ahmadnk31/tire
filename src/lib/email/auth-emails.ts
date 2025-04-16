import { sendLocalizedEmail } from './email-service';

/**
 * Send a verification email to a user in their preferred language
 * 
 * @param email User's email address
 * @param name User's name
 * @param verificationToken Verification token or code
 * @param locale User's preferred locale (e.g., 'en' or 'nl')
 * @returns Promise resolving to boolean indicating success/failure
 */
export async function sendVerificationEmail({
  email,
  name,
  verificationToken,
  locale = 'en',
}: {
  email: string;
  name: string;
  verificationToken: string;
  locale?: string;
}): Promise<boolean> {
  // Generate verification URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/${locale}/verify-email?token=${verificationToken}`;
  
  return sendLocalizedEmail({
    to: email,
    subject: 'subjects.verification',
    template: 'verification',
    templateData: {
      userName: name,
      verificationUrl,
      expiresInHours: 24,
      locale,
    },
    locale,
  });
}

/**
 * Send a password reset email to a user in their preferred language
 * 
 * @param email User's email address
 * @param name User's name
 * @param resetToken Reset token or code
 * @param locale User's preferred locale (e.g., 'en' or 'nl')
 * @returns Promise resolving to boolean indicating success/failure
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetToken,
  locale = 'en',
}: {
  email: string;
  name: string;
  resetToken: string;
  locale?: string;
}): Promise<boolean> {
  // Generate reset URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/${locale}/reset-password?token=${resetToken}`;
  
  return sendLocalizedEmail({
    to: email,
    subject: 'subjects.passwordReset',
    template: 'passwordReset',
    templateData: {
      userName: name,
      resetUrl,
      expiresInHours: 1,
      locale,
    },
    locale,
  });
}

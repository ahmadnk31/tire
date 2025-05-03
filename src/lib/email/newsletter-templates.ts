/**
 * Email templates for newsletter subscriptions and notifications
 */

interface SubscriptionTemplateParams {
  name?: string;
  unsubscribeUrl: string;
  siteUrl: string;
  siteName: string;
}

interface VerificationTemplateParams {
  name?: string;
  verificationUrl: string;
  siteUrl: string;
  siteName: string;
  expiryHours: number;
}

/**
 * Generates HTML for subscription confirmation email
 */
export function getSubscriptionConfirmationHtml({
  name = "",
  unsubscribeUrl,
  siteUrl,
  siteName,
}: SubscriptionTemplateParams): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 180px;
      margin: 0 auto;
    }
    .content {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      text-align: center;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #e60000;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>${siteName} Newsletter</h2>
  </div>
  <div class="content">
    <p>${greeting}</p>
    <p>Thank you for subscribing to our newsletter! You're now part of our community and will be among the first to receive:</p>
    <ul>
      <li>Special promotions and tire sales</li>
      <li>Seasonal maintenance tips</li>
      <li>New product announcements</li>
      <li>Expert automotive advice</li>
    </ul>
    <p>We're excited to have you on board and look forward to providing you with valuable content.</p>
    <p>If you wish to visit our website, click the button below:</p>
    <p style="text-align: center;">
      <a href="${siteUrl}" class="button">Visit Our Website</a>
    </p>
  </div>
  <div class="footer">
    <p>If you didn't subscribe to this newsletter, or if you wish to unsubscribe at any time, <a href="${unsubscribeUrl}">click here</a>.</p>
    <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
  </div>
</body>
</html>`;
}

/**
 * Generates text version for subscription confirmation email
 */
export function getSubscriptionConfirmationText({
  name = "",
  unsubscribeUrl,
  siteUrl,
  siteName,
}: SubscriptionTemplateParams): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `${greeting}

Thank you for subscribing to our newsletter! You're now part of our community and will be among the first to receive:

- Special promotions and tire sales
- Seasonal maintenance tips
- New product announcements
- Expert automotive advice

We're excited to have you on board and look forward to providing you with valuable content.

Visit our website: ${siteUrl}

If you didn't subscribe to this newsletter, or if you wish to unsubscribe at any time, use this link:
${unsubscribeUrl}

© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
}

/**
 * Generates HTML for unsubscribe confirmation email
 */
export function getUnsubscribeConfirmationHtml({
  name = "",
  siteUrl,
  siteName,
}: Omit<SubscriptionTemplateParams, "unsubscribeUrl">): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe Confirmation</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 180px;
      margin: 0 auto;
    }
    .content {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      text-align: center;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>${siteName} Newsletter</h2>
  </div>
  <div class="content">
    <p>${greeting}</p>
    <p>You have been successfully unsubscribed from our newsletter.</p>
    <p>We're sorry to see you go. If you have any feedback on how we could improve our newsletters, please let us know.</p>
    <p>If you change your mind, you can always subscribe again on our website.</p>
    <p style="text-align: center;">
      <a href="${siteUrl}" class="button">Visit Our Website</a>
    </p>
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
  </div>
</body>
</html>`;
}

/**
 * Generates text version for unsubscribe confirmation email
 */
export function getUnsubscribeConfirmationText({
  name = "",
  siteUrl,
  siteName,
}: Omit<SubscriptionTemplateParams, "unsubscribeUrl">): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `${greeting}

You have been successfully unsubscribed from our newsletter.

We're sorry to see you go. If you have any feedback on how we could improve our newsletters, please let us know.

If you change your mind, you can always subscribe again on our website.

Visit our website: ${siteUrl}

© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
}

/**
 * Generates HTML for email verification (double opt-in)
 */
export function getVerificationEmailHtml({
  name = "",
  verificationUrl,
  siteUrl,
  siteName,
  expiryHours,
}: VerificationTemplateParams): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email Subscription</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 180px;
      margin: 0 auto;
    }
    .content {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      text-align: center;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #e60000;
      color: white;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .verification-note {
      font-size: 14px;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>${siteName} Newsletter Verification</h2>
  </div>
  <div class="content">
    <p>${greeting}</p>
    <p>Thank you for signing up for our newsletter. To complete your subscription and start receiving our updates, please verify your email address by clicking the button below:</p>
    <p style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify My Email</a>
    </p>
    <p class="verification-note">This verification link will expire in ${expiryHours} hours.</p>
    <p>If you can't click the button, copy and paste this URL into your browser:</p>
    <p style="word-break: break-all; font-size: 14px;">
      ${verificationUrl}
    </p>
    <p>If you didn't sign up for our newsletter, you can safely ignore this email.</p>
  </div>
  <div class="footer">
    <p>This is an automated message from ${siteUrl}. Please do not reply to this email.</p>
    <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
  </div>
</body>
</html>`;
}

/**
 * Generates text version for email verification
 */
export function getVerificationEmailText({
  name = "",
  verificationUrl,
  siteUrl,
  siteName,
  expiryHours,
}: VerificationTemplateParams): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return `${greeting}

Thank you for signing up for our newsletter. To complete your subscription and start receiving our updates, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in ${expiryHours} hours.

If you didn't sign up for our newsletter, you can safely ignore this email.

This is an automated message from ${siteUrl}. Please do not reply to this email.

© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
}

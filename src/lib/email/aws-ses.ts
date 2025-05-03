import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client
const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

interface SendEmailParams {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Sends an email using AWS SES
 */
export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
  from = process.env.SES_FROM_EMAIL!,
  replyTo = process.env.EMAIL_REPLY_TO || from,
}: SendEmailParams) {
  const recipients = Array.isArray(to) ? to : [to];
  
  const command = new SendEmailCommand({
    Source: from,
    ReplyToAddresses: [replyTo],
    Destination: {
      ToAddresses: recipients,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        ...(textBody && {
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        }),
      },
    },
  });

  try {
    const result = await ses.send(command);
    console.log("Email sent successfully", result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Send a batch of emails using AWS SES
 * Note: AWS SES has a limit of 50 destinations per batch
 */
export async function sendBulkEmail({
  to,
  subject,
  htmlBody,
  textBody,
  from = process.env.EMAIL_FROM || "noreply@yourdomain.com",
  replyTo = process.env.EMAIL_REPLY_TO || from,
}: SendEmailParams) {
  const recipients = Array.isArray(to) ? to : [to];
  const BATCH_SIZE = 50; // AWS SES limit is 50 destinations per API call
  
  const batches = [];
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batchRecipients = recipients.slice(i, i + BATCH_SIZE);
    batches.push(batchRecipients);
  }
  
  const results = [];
  
  for (const batch of batches) {
    try {
      const result = await sendEmail({
        to: batch,
        subject,
        htmlBody,
        textBody,
        from,
        replyTo,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to send batch to ${batch.length} recipients:`, error);
      results.push({ success: false, error, recipients: batch });
    }
  }
  
  return results;
}

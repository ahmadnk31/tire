import AWS from 'aws-sdk';

// Configure AWS SDK
export const configureSES = () => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  });

  return new AWS.SES({ apiVersion: '2010-12-01' });
};

// Send a single email
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from = process.env.AWS_SES_FROM_EMAIL,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}) => {
  if (!from) {
    throw new Error('Sender email address is required');
  }

  const ses = configureSES();

  const params = {
    Source: from,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: html },
        ...(text && { Text: { Data: text } }),
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    console.error('Error sending email with SES:', error);
    return {
      success: false,
      error,
    };
  }
};

// Send bulk emails (for promotions to multiple recipients)
export const sendBulkEmails = async ({
  recipients,
  subject,
  htmlTemplate,
  textTemplate,
  from = process.env.AWS_SES_FROM_EMAIL,
  trackingParams = {},
}: {
  recipients: Array<{ email: string; replacements?: Record<string, string> }>;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  from?: string;
  trackingParams?: Record<string, string>;
}) => {
  if (!from) {
    throw new Error('Sender email address is required');
  }

  // Process in batches of 50 to avoid SES rate limits
  const batchSize = 50;
  const results = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(({ email, replacements = {} }) => {
      // Replace template placeholders with actual values
      let personalizedHtml = htmlTemplate;
      let personalizedText = textTemplate || '';
      
      // Replace standard placeholders
      personalizedHtml = personalizedHtml.replace(/{{email}}/g, email);
      personalizedText = personalizedText.replace(/{{email}}/g, email);
      
      // Replace custom placeholders
      Object.entries(replacements).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        personalizedHtml = personalizedHtml.replace(regex, value);
        personalizedText = personalizedText.replace(regex, value);
      });
      
      // Add tracking parameters if needed
      if (Object.keys(trackingParams).length > 0) {
        personalizedHtml = addTrackingParameters(personalizedHtml, {
          ...trackingParams,
          recipient: email,
        });
      }
      
      return sendEmail({
        to: email,
        subject,
        html: personalizedHtml,
        text: personalizedText || undefined,
        from,
      });
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Wait a bit between batches to avoid hitting rate limits
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    success: results.every(result => result.success),
    totalSent: results.filter(result => result.success).length,
    totalFailed: results.filter(result => !result.success).length,
    results,
  };
};

// Helper function to add tracking parameters to links in HTML
const addTrackingParameters = (html: string, params: Record<string, string>): string => {
  // Create URL params string
  const urlParams = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  // Replace all href attributes to include tracking params
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `href="${url}${separator}${urlParams}"`;
  });
};

// Track email opens via a 1x1 transparent pixel
export const getTrackingPixel = (campaignId: string, recipientId: string): string => {
  const trackingUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/promotions/track-open?cid=${campaignId}&rid=${recipientId}`;
  
  return `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;"/>`;
};

/**
 * Email Service
 * Handles password reset emails and other transactional communications
 * Supports both development (console logging) and production (SMTP) modes
 */

import { logger } from '../logging/unified-logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Generate password reset email template
 */
function generatePasswordResetEmail(email: string, resetToken: string): { html: string; text: string } {
  // Frontend URL where user can reset password
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { background-color: white; padding: 20px; border-radius: 5px; max-width: 600px; margin: 20px auto; }
          .header { color: #333; font-size: 24px; margin-bottom: 20px; }
          .content { color: #666; line-height: 1.6; margin-bottom: 20px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Reset Your Password</div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your ZANTARA account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p><code>${resetLink}</code></p>
            <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>ZANTARA by Bali Zero &copy; 2025</p>
            <p>This email was sent to: ${email}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Password Reset Request

Hello,

We received a request to reset the password for your ZANTARA account.

Reset Password Link (expires in 1 hour):
${resetLink}

If you didn't request this, you can safely ignore this email.

---
ZANTARA by Bali Zero © 2025
  `.trim();

  return { html, text };
}

/**
 * Send email
 * In development: logs to console
 * In production: sends via configured email service
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, text } = options;

  try {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // Development mode: log to console instead of sending
      logger.info('📧 [DEV MODE] Email would be sent:', {
        to,
        subject,
        preview: html.substring(0, 100) + '...',
      });

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    // Production mode: Send via configured service
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

    if (emailProvider === 'sendgrid') {
      return await sendViaSendGrid(to, subject, html, text);
    } else if (emailProvider === 'smtp') {
      return await sendViaSMTP(to, subject, html, text);
    } else {
      // Fallback to console logging
      logger.warn('Unknown email provider, falling back to console logging');
      return {
        success: true,
        messageId: `fallback-${Date.now()}`,
      };
    }
  } catch (error: any) {
    logger.error('Email send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send via SendGrid API
 */
async function sendViaSendGrid(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable not set');
    }

    const fromEmail = process.env.EMAIL_FROM || 'noreply@balizero.com';

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: { email: fromEmail },
        subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
          ...(text
            ? [
                {
                  type: 'text/plain',
                  value: text,
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${error}`);
    }

    logger.info('Email sent via SendGrid:', { to, subject });

    return {
      success: true,
      messageId: `sendgrid-${Date.now()}`,
    };
  } catch (error: any) {
    logger.error('SendGrid email error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send via SMTP (Nodemailer would go here)
 * For now, this is a placeholder that suggests using SendGrid or another service
 */
async function sendViaSMTP(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  logger.warn('SMTP email provider not fully configured. Please set EMAIL_PROVIDER=sendgrid and SENDGRID_API_KEY.');

  // For MVP, we'll just log it
  logger.info('📧 Email (SMTP mode):', {
    to,
    subject,
    preview: html.substring(0, 50) + '...',
  });

  return {
    success: true,
    messageId: `smtp-fallback-${Date.now()}`,
  };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { html, text } = generatePasswordResetEmail(email, resetToken);

    const result = await sendEmail({
      to: email,
      subject: 'Reset Your ZANTARA Password',
      html,
      text,
    });

    return result.success
      ? { success: true }
      : {
          success: false,
          error: result.error || 'Failed to send password reset email',
        };
  } catch (error: any) {
    logger.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email',
    };
  }
}

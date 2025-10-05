// Gmail Handlers (typed & standardized)
import { google } from 'googleapis';
import { getOAuth2Client } from '../../services/oauth2-client.js';
import { getGmail } from '../../services/google-auth-service.js';
import { ok } from '../../utils/response.js';
import { BadRequestError, InternalServerError } from '../../utils/errors.js';

// Param interfaces
export interface SendEmailParams { to: string; subject: string; body?: string; html?: string }
export interface ListEmailParams { maxResults?: number; q?: string }
export interface ReadEmailParams { messageId: string }

// Result interfaces
export interface GmailSendResult { messageId?: string; threadId?: string; to: string; subject: string; sentAt: string }
export interface GmailListResult { messages: Array<{ id?: string; threadId?: string; snippet?: string; subject?: string; from?: string; date?: string; labelIds?: string[] }>; total: number; nextPageToken?: string }
export interface GmailReadResult { message: { id?: string; threadId?: string; subject?: string; from?: string; date?: string; snippet?: string; body?: string; labelIds?: string[]; historyId?: string } }

export const gmailHandlers = {
  'gmail.send': async (params: SendEmailParams) => {
    const { to, subject, body, html } = params || ({} as SendEmailParams);
    if (!to || !subject) throw new BadRequestError('Parameters "to" and "subject" are required');

    try {
      // Try to get Gmail service with unified authentication
      let gmailService = await getGmail();

      if (!gmailService) {
        // Fallback to OAuth2 client if available
        const auth = await getOAuth2Client();
        if (!auth) {
          throw new Error('No authentication method available for Gmail (Service Account needs Domain-Wide Delegation)');
        }
        gmailService = google.gmail({ version: 'v1', auth });
      }

      // Create email message
      const message = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        html || body || ''
      ].join('\n');

      // Encode in base64
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await gmailService.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      return ok({
        messageId: result.data.id,
        threadId: result.data.threadId,
        to,
        subject,
        sentAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Gmail send error:', error);
      throw new InternalServerError(`Failed to send email: ${error.message}`);
    }
  },

  'gmail.list': async (params: ListEmailParams = {}) => {
    const { maxResults = 10, q = '' } = params || {} as ListEmailParams;

    try {
      // Try to get Gmail service with unified authentication
      let gmail = await getGmail();

      if (!gmail) {
        // Fallback to OAuth2 client if available
        const auth = await getOAuth2Client();
        if (!auth) {
          throw new Error('No authentication method available for Gmail (Service Account needs Domain-Wide Delegation)');
        }
        gmail = google.gmail({ version: 'v1', auth });
      }

      const result = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q
      });

      const messages = result.data.messages || [];

      // Get details for first 5 messages
      const details = await Promise.all(
        messages.slice(0, 5).map(msg =>
          gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date']
          })
        )
      );

      return ok({
        messages: details.map(d => ({
          id: d.data.id,
          threadId: d.data.threadId,
          snippet: d.data.snippet,
          subject: d.data.payload?.headers?.find(h => h.name === 'Subject')?.value,
          from: d.data.payload?.headers?.find(h => h.name === 'From')?.value,
          date: d.data.payload?.headers?.find(h => h.name === 'Date')?.value,
          labelIds: d.data.labelIds
        })),
        total: messages.length,
        nextPageToken: result.data.nextPageToken
      });
    } catch (error: any) {
      console.error('Gmail list error:', error);
      throw new InternalServerError(`Failed to list emails: ${error.message}`);
    }
  },

  'gmail.read': async (params: ReadEmailParams) => {
    const { messageId } = params || ({} as ReadEmailParams);
    if (!messageId) throw new BadRequestError('Parameter "messageId" is required');

    try {
      // Prefer Service Account with Domain‑Wide Delegation when available
      let gmailService = await getGmail();
      if (!gmailService) {
        // Fallback to OAuth2 client if available
        const auth = await getOAuth2Client();
        if (!auth) {
          throw new Error('No authentication method available for Gmail (Service Account needs Domain-Wide Delegation)');
        }
        gmailService = google.gmail({ version: 'v1', auth });
      }

      const result = await gmailService.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = result.data;
      const headers = message.payload?.headers || [];

      // Extract body content
      let bodyContent = '';
      const extractTextContent = (payload: any): string => {
        if (payload.body?.data) {
          return Buffer.from(payload.body.data, 'base64').toString();
        }

        if (payload.parts) {
          for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
              if (part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString();
              }
            }
            // Recursive check for nested parts
            const nestedContent = extractTextContent(part);
            if (nestedContent) return nestedContent;
          }
        }
        return '';
      };

      bodyContent = extractTextContent(message.payload);

      return ok({
        message: {
          id: message.id,
          threadId: message.threadId,
          snippet: message.snippet,
          subject: headers.find((h: any) => h.name === 'Subject')?.value,
          from: headers.find((h: any) => h.name === 'From')?.value,
          to: headers.find((h: any) => h.name === 'To')?.value,
          date: headers.find((h: any) => h.name === 'Date')?.value,
          body: bodyContent,
          labelIds: message.labelIds,
          historyId: message.historyId
        }
      });
    } catch (error: any) {
      console.error('Gmail read error:', error);
      throw new InternalServerError(`Failed to read email: ${error.message}`);
    }
  }
};

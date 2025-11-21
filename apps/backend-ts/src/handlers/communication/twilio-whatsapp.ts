/**
 * ZANTARA Twilio WhatsApp Integration
 * Alternative to Meta WhatsApp API (no waiting periods!)
 * Twilio Sandbox: whatsapp:+14155238886
 */

import { ok } from '../../utils/response.js';
import { logger } from '../../logging/unified-logger.js';
import { BadRequestError } from '../../utils/errors.js';

// Twilio Configuration
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
};

// Lazy load Twilio (only when needed)
let twilioClient: any = null;
function getTwilioClient() {
  if (!twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_CONFIG.accountSid, TWILIO_CONFIG.authToken);
  }
  return twilioClient;
}

/**
 * Twilio WhatsApp Webhook Receiver
 * Handles incoming messages from Twilio sandbox
 */
export async function twilioWhatsappWebhook(req: any, res: any) {
  try {
    const { Body, From, To, MessageSid } = req.body;

    logger.info('📞 Twilio WhatsApp Message Received:', {
      from: From,
      to: To,
      message: Body,
      sid: MessageSid,
    });

    // Quick ACK to Twilio
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

    // Process message asynchronously
    await handleTwilioMessage(From, Body, MessageSid);
  } catch (error) {
    logger.error('❌ Twilio Webhook Error:', error as Error);
    // Still return 200 to Twilio to avoid retries
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}

/**
 * Handle incoming Twilio WhatsApp message
 */
async function handleTwilioMessage(from: string, message: string, _messageSid: string) {
  try {
    logger.info('💬 Processing message from ${from}: "${message}"', { type: 'debug_migration' });

    // Simple auto-reply for now
    const reply = `✅ Zantara ricevuto il tuo messaggio: "${message}"\n\nSto elaborando la risposta...`;

    await sendTwilioWhatsapp(from, reply);
  } catch (error) {
    logger.error('❌ Error handling Twilio message:', error as Error);
  }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendTwilioWhatsapp(to: string, message: string) {
  try {
    const client = getTwilioClient();

    const result = await client.messages.create({
      from: TWILIO_CONFIG.whatsappNumber,
      to: to, // Must be in format "whatsapp:+1234567890"
      body: message,
    });

    logger.info(`✅ Twilio WhatsApp message sent to ${to}:`, result.sid);
    return result;
  } catch (error) {
    logger.error('❌ Error sending Twilio WhatsApp:', error as Error);
    throw error;
  }
}

/**
 * Handler: Send WhatsApp via Twilio (manual endpoint)
 */
export async function twilioSendWhatsapp(req: any, _res?: any) {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      throw new BadRequestError('Missing "to" or "message"');
    }

    // Ensure "to" has whatsapp: prefix
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await sendTwilioWhatsapp(whatsappTo, message);

    return ok({
      success: true,
      messageSid: result.sid,
      to: whatsappTo,
    });
  } catch (error: any) {
    logger.error('❌ Twilio send error:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

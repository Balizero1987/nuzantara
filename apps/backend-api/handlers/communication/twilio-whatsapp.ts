/**
 * ZANTARA Twilio WhatsApp Integration
 * Alternative to Meta WhatsApp API (no waiting periods!)
 * Twilio Sandbox: whatsapp:+14155238886
 */

import { ok, err } from '../../utils/response.js';
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

    console.log('📞 Twilio WhatsApp Message Received:', {
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
    console.error('❌ Twilio Webhook Error:', error);
    // Still return 200 to Twilio to avoid retries
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}

/**
 * Handle incoming Twilio WhatsApp message
 */
async function handleTwilioMessage(from: string, message: string, messageSid: string) {
  try {
    console.log(`💬 Processing message from ${from}: "${message}"`);

    // Simple auto-reply for now
    const reply = `✅ Zantara ricevuto il tuo messaggio: "${message}"\n\nSto elaborando la risposta...`;

    await sendTwilioWhatsapp(from, reply);
  } catch (error) {
    console.error('❌ Error handling Twilio message:', error);
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

    console.log(`✅ Twilio WhatsApp message sent to ${to}:`, result.sid);
    return result;
  } catch (error) {
    console.error('❌ Error sending Twilio WhatsApp:', error);
    throw error;
  }
}

/**
 * Handler: Send WhatsApp via Twilio (manual endpoint)
 */
export async function twilioSendWhatsapp(req: any, res: any) {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      throw new BadRequestError('Missing "to" or "message"');
    }

    // Ensure "to" has whatsapp: prefix
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    const result = await sendTwilioWhatsapp(whatsappTo, message);

    return ok(res, {
      success: true,
      messageSid: result.sid,
      to: whatsappTo,
    });
  } catch (error: any) {
    console.error('❌ Twilio send error:', error);
    return err(res, error.message, 500);
  }
}

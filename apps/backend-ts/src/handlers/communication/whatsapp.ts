/**
 * ZANTARA WhatsApp Business API Integration
 * Meta Business Account: PT BAYU BALI NOL
 * App: Zantara WA (ID: 1074166541097027)
 * Phone: +62 823-1355-1979
 */

import logger from '../../services/logger.js';
import axios from 'axios';
import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { memorySave, memorySearch } from '../memory/memory.js';
import { aiChat } from '../ai-services/ai.js';

// Meta WhatsApp API Configuration
const WHATSAPP_CONFIG = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '', // Will be auto-detected from webhook
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'zantara-balizero-2025-secure-token',
  apiVersion: 'v21.0',
  baseUrl: 'https://graph.facebook.com/v21.0'
};

// Group Intelligence Storage
interface GroupMember {
  userId: string;
  name: string;
  phone: string;
  role?: 'admin' | 'member';
  expertiseLevel?: 'beginner' | 'intermediate' | 'advanced';
  sentimentHistory: Array<{ date: string; score: number; message: string }>;
  topicsAsked: string[];
  engagementScore: number;
  lastActive: string;
}

interface GroupContext {
  groupId: string;
  groupName: string;
  members: Map<string, GroupMember>;
  analytics: {
    topQuestions: Array<{ question: string; count: number; answeredBy: string }>;
    sentimentTrend: Array<{ date: string; avgSentiment: number }>;
    conversionSignals: Array<{ userId: string; signalType: string; confidence: number }>;
  };
  createdAt: string;
  lastAnalyzed: string;
}

// In-memory cache for group contexts (will be persisted to Firestore)
const groupContexts = new Map<string, GroupContext>();

/**
 * Webhook verification endpoint
 * Meta calls this to verify the webhook URL
 */
export async function whatsappWebhookVerify(req: any, res: any) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('📞 WhatsApp Webhook Verification Request:', { mode, token });

  if (mode === 'subscribe' && token === WHATSAPP_CONFIG.verifyToken) {
    logger.info('✅ WhatsApp Webhook Verified');
    return res.status(200).send(challenge);
  } else {
    logger.error('❌ WhatsApp Webhook Verification Failed');
    return res.status(403).send('Forbidden');
  }
}

/**
 * Webhook receiver for WhatsApp messages
 * Handles: messages, statuses, group events
 */
export async function whatsappWebhookReceiver(req: any, res: any) {
  try {
    const body = req.body;

    // Quick ACK to Meta (required within 20s)
    res.status(200).send('EVENT_RECEIVED');

    logger.info('📨 WhatsApp Webhook Event:', JSON.stringify(body, null, 2));

    // Parse webhook payload
    if (!body.object || body.object !== 'whatsapp_business_account') {
      logger.info('⚠️ Not a WhatsApp business account event');
      return;
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          await handleIncomingMessage(change.value);
        }
      }
    }
  } catch (error) {
    logger.error('❌ WhatsApp Webhook Error:', error);
    // Still return 200 to Meta to avoid retries
  }
}

/**
 * Handle incoming WhatsApp message
 * Observer Mode: Analyze, memorize, respond smartly
 */
async function handleIncomingMessage(value: any) {
  try {
    const messages = value.messages || [];
    const contacts = value.contacts || [];
    const metadata = value.metadata || {};

    // Auto-detect phone number ID
    if (!WHATSAPP_CONFIG.phoneNumberId && metadata.phone_number_id) {
      WHATSAPP_CONFIG.phoneNumberId = metadata.phone_number_id;
      logger.info('📱 Auto-detected Phone Number ID:', WHATSAPP_CONFIG.phoneNumberId);
    }

    for (const message of messages) {
      const contact = contacts.find((c: any) => c.wa_id === message.from);
      const userName = contact?.profile?.name || message.from;

      logger.info(`💬 Message from ${userName} (${message.from}):`, message);

      // Determine context (group or 1-to-1)
      const isGroup = message.context?.group_id || false;
      const groupId = isGroup ? message.context.group_id : null;
      const groupName = isGroup ? message.context.group_subject : null;

      // Extract message content
      const messageText = extractMessageText(message);

      if (!messageText) {
        logger.info('⚠️ No text content, skipping');
        continue;
      }

      // 1. ALWAYS Save to memory (Observer mode)
      await saveMessageToMemory({
        userId: message.from,
        userName,
        message: messageText,
        isGroup,
        groupId,
        groupName,
        timestamp: new Date().toISOString()
      });

      // 2. Analyze sentiment
      const sentiment = await analyzeSentiment(messageText);
      logger.info(`😊 Sentiment: ${sentiment.score}/10 (${sentiment.label})`);

      // 3. Update group context if group message
      if (isGroup && groupId) {
        await updateGroupContext(groupId, groupName, message.from, userName, messageText, sentiment);
      }

      // 4. Decide if ZANTARA should respond
      const shouldRespond = await shouldZantaraRespond({
        message: messageText,
        isGroup,
        sentiment,
        userId: message.from,
        groupId
      });

      if (shouldRespond.respond) {
        logger.info(`🤖 ZANTARA responding: ${shouldRespond.reason}`);
        await sendIntelligentResponse(message.from, messageText, {
          userName,
          isGroup,
          groupId,
          sentiment,
          context: shouldRespond.context
        });
      } else {
        logger.info(`👁️ ZANTARA observing (no response): ${shouldRespond.reason}`);
      }

      // 5. Check for alerts (frustrated customer, conversion signal, etc.)
      await checkAndSendAlerts({
        userId: message.from,
        userName,
        message: messageText,
        sentiment,
        isGroup,
        groupId
      });
    }
  } catch (error) {
    logger.error('❌ Error handling incoming message:', error);
  }
}

/**
 * Extract text from various message types
 */
function extractMessageText(message: any): string | null {
  if (message.type === 'text') {
    return message.text?.body || null;
  }

  // Handle other types
  if (message.type === 'image') return '[Image]';
  if (message.type === 'document') return '[Document]';
  if (message.type === 'audio') return '[Voice Message]';
  if (message.type === 'video') return '[Video]';

  return null;
}

/**
 * Save message to Firestore memory
 */
async function saveMessageToMemory(data: any) {
  try {
    await memorySave({
      userId: data.userId,
      profile_facts: [
        `Name: ${data.userName}`,
        `Last message: ${data.message}`,
        `Date: ${data.timestamp}`,
        ...(data.isGroup ? [`Group: ${data.groupName}`] : [])
      ],
      summary: data.message.substring(0, 140),
      counters: { messages_sent: 1 }
    });

    logger.info('💾 Message saved to memory:', data.userId);
  } catch (error) {
    logger.error('❌ Error saving to memory:', error);
  }
}

/**
 * Analyze sentiment using Claude Haiku
 */
async function analyzeSentiment(text: string): Promise<{ score: number; label: string; urgency: string }> {
  try {
    const prompt = `Analyze sentiment of this WhatsApp message. Return JSON only:
{
  "score": 0-10 (0=very negative, 10=very positive),
  "label": "positive|neutral|negative",
  "urgency": "low|medium|high"
}

Message: "${text}"`;

    const response = await aiChat({
      prompt,
      max_tokens: 100,
      model: 'claude-3-5-haiku-20241022'
    });

    const responseData: any = response.data || response;
    const result = JSON.parse(responseData.response || responseData.answer || '{"score":5,"label":"neutral","urgency":"low"}');
    return result;
  } catch (error) {
    logger.error('❌ Sentiment analysis error:', error);
    return { score: 5, label: 'neutral', urgency: 'low' };
  }
}

/**
 * Update group context with new message
 */
async function updateGroupContext(
  groupId: string,
  groupName: string | null,
  userId: string,
  userName: string,
  message: string,
  sentiment: any
) {
  try {
    if (!groupContexts.has(groupId)) {
      groupContexts.set(groupId, {
        groupId,
        groupName: groupName || 'Unknown Group',
        members: new Map(),
        analytics: {
          topQuestions: [],
          sentimentTrend: [],
          conversionSignals: []
        },
        createdAt: new Date().toISOString(),
        lastAnalyzed: new Date().toISOString()
      });
    }

    const context = groupContexts.get(groupId)!;

    // Update member profile
    if (!context.members.has(userId)) {
      context.members.set(userId, {
        userId,
        name: userName,
        phone: userId,
        sentimentHistory: [],
        topicsAsked: [],
        engagementScore: 0,
        lastActive: new Date().toISOString()
      });
    }

    const member = context.members.get(userId)!;
    member.sentimentHistory.push({
      date: new Date().toISOString(),
      score: sentiment.score,
      message: message.substring(0, 100)
    });
    member.lastActive = new Date().toISOString();
    member.engagementScore += 1;

    logger.info(`📊 Group context updated: ${groupName} (${context.members.size} members)`);
  } catch (error) {
    logger.error('❌ Error updating group context:', error);
  }
}

/**
 * Smart decision: Should ZANTARA respond?
 */
async function shouldZantaraRespond(params: any): Promise<{ respond: boolean; reason: string; context?: any }> {
  const { message, isGroup, sentiment } = params;

  // Rule 1: Always respond if directly mentioned
  if (message.toLowerCase().includes('@bali zero') ||
      message.toLowerCase().includes('@zantara') ||
      message.toLowerCase().includes('bali zero')) {
    return { respond: true, reason: 'Direct mention' };
  }

  // Rule 2: In groups, be selective
  if (isGroup) {
    // Respond only to questions with keywords
    const keywords = ['kbli', 'pt pma', 'visa', 'kitas', 'tax', 'npwp', 'quanto costa', 'berapa', 'how much', 'timeline'];
    const hasKeyword = keywords.some(kw => message.toLowerCase().includes(kw));

    if (hasKeyword && message.includes('?')) {
      return { respond: true, reason: 'Question with keyword in group' };
    }

    return { respond: false, reason: 'Group message without keyword' };
  }

  // Rule 3: In 1-to-1, respond to questions or if sentiment is negative
  if (message.includes('?')) {
    return { respond: true, reason: '1-to-1 question' };
  }

  if (sentiment.urgency === 'high' || sentiment.score < 4) {
    return { respond: true, reason: 'Urgent or negative sentiment' };
  }

  // Rule 4: Don't respond to generic greetings
  const greetings = ['hi', 'hello', 'ciao', 'halo', 'thanks', 'grazie', 'terima kasih', 'ok', 'oke'];
  if (greetings.includes(message.toLowerCase().trim())) {
    return { respond: false, reason: 'Generic greeting' };
  }

  // Default: respond to 1-to-1, observe groups
  return {
    respond: !isGroup,
    reason: isGroup ? 'Observer mode in group' : '1-to-1 message'
  };
}

/**
 * Send intelligent response using ZANTARA AI
 */
export function buildWhatsappPrompt(context: any, recentContext: string, userMessage: string) {
  return `You are ZANTARA, Bali Zero's AI assistant for Indonesian business setup, visas, and tax.

User: ${context.userName}
${context.isGroup ? `Group: ${context.groupId}` : '1-to-1 chat'}
Sentiment: ${context.sentiment?.label} (${context.sentiment?.score}/10)

Recent context: ${recentContext}

User message: "${userMessage}"

Respond professionally in the user's language (ID/EN/IT). Be concise for WhatsApp (max 2 paragraphs). Include relevant info about KBLI, PT PMA, KITAS, or pricing if asked.`;
}

async function sendIntelligentResponse(to: string, userMessage: string, context: any) {
  try {
    // Retrieve user memory
    const memoryRes: { ok: boolean; data?: { memories?: Array<{ content?: string }>; count?: number; query?: string } } = await memorySearch({
      userId: to,
      query: userMessage,
      limit: 3
    });
    const recentContext = Array.isArray(memoryRes?.data?.memories) && memoryRes.data!.memories!.length > 0
      ? memoryRes.data!.memories!.map((m: any) => m?.content).filter(Boolean).slice(0, 3).join(' | ')
      : 'No previous context';

    // Build context-aware prompt
    const prompt = buildWhatsappPrompt(context, recentContext, userMessage);

    const aiResponse = await aiChat({
      prompt,
      max_tokens: 300,
      model: 'claude-3-5-haiku-20241022'
    });

    const responseData: any = aiResponse.data || aiResponse;
    const responseText = responseData.response || responseData.answer || 'Mi dispiace, non ho capito. Puoi riformulare?';

    // Send via WhatsApp API
    await sendWhatsAppMessage(to, responseText);

    logger.info(`✅ Response sent to ${context.userName}`);
  } catch (error) {
    logger.error('❌ Error sending intelligent response:', error);
  }
}

/**
 * Send WhatsApp message via Meta API
 */
async function sendWhatsAppMessage(to: string, text: string) {
  try {
    const url = `${WHATSAPP_CONFIG.baseUrl}/${WHATSAPP_CONFIG.phoneNumberId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('📤 WhatsApp message sent:', response.data);
    return response.data;
  } catch (error: any) {
    logger.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Check for alerts and notify team
 */
async function checkAndSendAlerts(params: any) {
  const { userName, message, sentiment } = params;

  const alerts = [];

  // Alert 1: Negative sentiment
  if (sentiment.score < 4) {
    alerts.push({
      type: 'negative_sentiment',
      severity: 'medium',
      message: `⚠️ ${userName} has negative sentiment (${sentiment.score}/10): "${message}"`
    });
  }

  // Alert 2: High urgency
  if (sentiment.urgency === 'high') {
    alerts.push({
      type: 'high_urgency',
      severity: 'high',
      message: `🔥 ${userName} needs urgent attention: "${message}"`
    });
  }

  // Alert 3: Conversion signals
  const conversionKeywords = ['ready', 'proceed', 'start', 'payment', 'invoice', 'mulai', 'siap'];
  if (conversionKeywords.some(kw => message.toLowerCase().includes(kw))) {
    alerts.push({
      type: 'conversion_signal',
      severity: 'high',
      message: `💰 ${userName} showing conversion intent: "${message}"`
    });
  }

  // Send alerts to team via Slack/Discord
  for (const alert of alerts) {
    logger.info(`🚨 ALERT [${alert.severity}]:`, alert.message);

    // Send to Slack/Discord (if webhooks configured)
    try {
      await sendTeamAlert(alert);
    } catch (error) {
      logger.error('❌ Failed to send team alert:', error);
    }
  }
}

/**
 * Send alert to team via Slack/Discord webhooks
 */
async function sendTeamAlert(alert: any) {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;

  if (!slackWebhook && !discordWebhook) {
    logger.info('⚠️ No webhook URLs configured (SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL)');
    return;
  }

  const message = {
    text: `🚨 **${alert.type.toUpperCase()}** [${alert.severity}]\n\n${alert.message}`,
    attachments: [{
      color: alert.severity === 'high' ? 'danger' : 'warning',
      fields: [
        { title: 'Type', value: alert.type, short: true },
        { title: 'Severity', value: alert.severity, short: true },
        { title: 'Timestamp', value: new Date().toISOString(), short: false }
      ]
    }]
  };

  // Send to Slack
  if (slackWebhook) {
    try {
      await axios.post(slackWebhook, message);
      logger.info('✅ Alert sent to Slack');
    } catch (error: any) {
      logger.error('❌ Slack webhook failed:', error.message);
    }
  }

  // Send to Discord (different format)
  if (discordWebhook) {
    try {
      const discordMessage = {
        content: `🚨 **${alert.type.toUpperCase()}** [${alert.severity}]`,
        embeds: [{
          description: alert.message,
          color: alert.severity === 'high' ? 15158332 : 16776960, // Red or Yellow
          timestamp: new Date().toISOString()
        }]
      };
      await axios.post(discordWebhook, discordMessage);
      logger.info('✅ Alert sent to Discord');
    } catch (error: any) {
      logger.error('❌ Discord webhook failed:', error.message);
    }
  }
}

/**
 * Get group analytics
 */
export async function getGroupAnalytics(params: any) {
  const { groupId } = params;

  if (!groupId) {
    throw new BadRequestError('groupId is required');
  }

  const context = groupContexts.get(groupId);

  if (!context) {
    return ok({
      message: 'Group not found or no data yet',
      groupId
    });
  }

  // Calculate analytics
  const members = Array.from(context.members.values());
  const avgSentiment = members.reduce((sum, m) => {
    const recent = m.sentimentHistory.slice(-5);
    const avg = recent.reduce((s, h) => s + h.score, 0) / (recent.length || 1);
    return sum + avg;
  }, 0) / (members.length || 1);

  return ok({
    groupId: context.groupId,
    groupName: context.groupName,
    stats: {
      totalMembers: members.length,
      avgSentiment: avgSentiment.toFixed(1),
      totalMessages: members.reduce((sum, m) => sum + m.engagementScore, 0),
      topContributors: members
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 5)
        .map(m => ({ name: m.name, messages: m.engagementScore }))
    },
    analytics: context.analytics,
    lastAnalyzed: context.lastAnalyzed
  });
}

/**
 * Send manual message (for testing or proactive outreach)
 */
export async function sendManualMessage(params: any) {
  const { to, message } = params;

  if (!to || !message) {
    throw new BadRequestError('to and message are required');
  }

  await sendWhatsAppMessage(to, message);

  return ok({
    sent: true,
    to,
    message,
    timestamp: new Date().toISOString()
  });
}

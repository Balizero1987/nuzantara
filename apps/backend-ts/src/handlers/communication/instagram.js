/**
 * ZANTARA Instagram Business API Integration
 * Reuses 80% of WhatsApp code for Instagram DM
 *
 * Account: @balizero0
 * Meta Business: PT BAYU BALI NOL
 * App: Zantara WA (ID: 1074166541097027) - same as WhatsApp
 */
import logger from '../../services/logger.js';
import axios from 'axios';
import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { memorySave, memorySearch } from '../memory/memory-firestore.js';
import { aiChat } from '../ai-services/ai.js';
// Instagram API Configuration (same Meta app as WhatsApp)
const INSTAGRAM_CONFIG = {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '',
    pageId: process.env.INSTAGRAM_PAGE_ID || '', // Auto-detected from webhook
    instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID || '', // Auto-detected
    verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN || 'zantara-balizero-2025-secure-token',
    apiVersion: 'v21.0',
    baseUrl: 'https://graph.facebook.com/v21.0'
};
// In-memory cache for Instagram users
const instagramUsers = new Map();
/**
 * Webhook verification endpoint (same as WhatsApp)
 */
export async function instagramWebhookVerify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    logger.info('📸 Instagram Webhook Verification Request:', { mode, token });
    if (mode === 'subscribe' && token === INSTAGRAM_CONFIG.verifyToken) {
        logger.info('✅ Instagram Webhook Verified');
        return res.status(200).send(challenge);
    }
    else {
        logger.error('❌ Instagram Webhook Verification Failed');
        return res.status(403).send('Forbidden');
    }
}
/**
 * Webhook receiver for Instagram messages
 * Handles: DMs, Story replies, Mentions
 */
export async function instagramWebhookReceiver(req, res) {
    try {
        const body = req.body;
        // Quick ACK to Meta (required within 20s)
        res.status(200).send('EVENT_RECEIVED');
        logger.info('📸 Instagram Webhook Event:', JSON.stringify(body, null, 2));
        // Parse webhook payload
        if (!body.object || body.object !== 'instagram') {
            logger.info('⚠️ Not an Instagram event');
            return;
        }
        for (const entry of body.entry || []) {
            // Auto-detect Page ID and Instagram Account ID
            if (entry.id && !INSTAGRAM_CONFIG.pageId) {
                INSTAGRAM_CONFIG.pageId = entry.id;
                logger.info('📄 Auto-detected Page ID:', INSTAGRAM_CONFIG.pageId);
            }
            // Handle different event types
            for (const messaging of entry.messaging || []) {
                await handleInstagramMessage(messaging);
            }
            // Handle story mentions/replies
            for (const change of entry.changes || []) {
                if (change.field === 'mentions') {
                    await handleStoryMention(change.value);
                }
            }
        }
    }
    catch (error) {
        logger.error('❌ Instagram Webhook Error:', error);
        // Still return 200 to Meta
    }
}
/**
 * Handle Instagram DM
 */
async function handleInstagramMessage(messaging) {
    try {
        const senderId = messaging.sender?.id;
        const recipientId = messaging.recipient?.id;
        const message = messaging.message;
        if (!senderId || !message) {
            logger.info('⚠️ No sender or message, skipping');
            return;
        }
        // Auto-detect Instagram Account ID
        if (recipientId && !INSTAGRAM_CONFIG.instagramAccountId) {
            INSTAGRAM_CONFIG.instagramAccountId = recipientId;
            logger.info('📸 Auto-detected Instagram Account ID:', recipientId);
        }
        // Get user info
        const userInfo = await getInstagramUserInfo(senderId);
        const username = userInfo.username || senderId;
        logger.info(`💬 Instagram DM from @${username}:`, message);
        // Extract message text
        const messageText = message.text || '[Media]';
        // 1. ALWAYS Save to memory
        await saveInstagramMessageToMemory({
            userId: senderId,
            username,
            message: messageText,
            userInfo,
            timestamp: new Date().toISOString()
        });
        // 2. Analyze sentiment
        const sentiment = await analyzeSentiment(messageText);
        logger.info(`😊 Sentiment: ${sentiment.score}/10 (${sentiment.label})`);
        // 3. Update user profile
        await updateInstagramUserProfile(senderId, username, messageText, sentiment, userInfo);
        // 4. Decide if ZANTARA should respond
        const shouldRespond = await shouldZantaraRespondInstagram({
            message: messageText,
            sentiment,
            userId: senderId,
            userInfo
        });
        if (shouldRespond.respond) {
            logger.info(`🤖 ZANTARA responding: ${shouldRespond.reason}`);
            await sendIntelligentInstagramResponse(senderId, messageText, {
                username,
                sentiment,
                userInfo,
                context: shouldRespond.context
            });
        }
        else {
            logger.info(`👁️ ZANTARA observing: ${shouldRespond.reason}`);
        }
        // 5. Check for alerts (high-value lead, frustrated user, etc.)
        await checkInstagramAlerts({
            userId: senderId,
            username,
            message: messageText,
            sentiment,
            userInfo
        });
    }
    catch (error) {
        logger.error('❌ Error handling Instagram message:', error);
    }
}
/**
 * Handle Story mention/reply
 */
async function handleStoryMention(value) {
    try {
        const mediaId = value.media_id;
        // const commentId = value.comment_id; // Not used
        const text = value.text;
        logger.info('📖 Story mention/reply:', { mediaId, text });
        // Get user who mentioned/replied
        const userId = value.from?.id;
        const username = value.from?.username;
        if (!userId)
            return;
        // Response to story mention
        const response = `Grazie per aver menzionato Bali Zero! 🙏\n\nCome posso aiutarti con i servizi per l'Indonesia?\n- PT PMA Setup\n- KITAS/Visa\n- Tax & NPWP\n- Business Consulting`;
        await sendInstagramMessage(userId, response);
        logger.info(`✅ Responded to story mention from @${username}`);
    }
    catch (error) {
        logger.error('❌ Error handling story mention:', error);
    }
}
/**
 * Get Instagram user info
 */
async function getInstagramUserInfo(userId) {
    try {
        const url = `${INSTAGRAM_CONFIG.baseUrl}/${userId}?fields=id,username,name,profile_pic,follower_count,is_verified&access_token=${INSTAGRAM_CONFIG.accessToken}`;
        const response = await axios.get(url);
        return response.data;
    }
    catch (error) {
        logger.error('⚠️ Error getting user info:', error.response?.data || error.message);
        return { username: userId, id: userId };
    }
}
/**
 * Save Instagram message to Firestore memory
 */
async function saveInstagramMessageToMemory(data) {
    try {
        await memorySave({
            userId: `instagram_${data.userId}`, // Prefix to distinguish from WhatsApp
            profile_facts: [
                `Instagram: @${data.username}`,
                `Name: ${data.userInfo.name || 'Unknown'}`,
                `Followers: ${data.userInfo.follower_count || 0}`,
                `Verified: ${data.userInfo.is_verified ? 'Yes' : 'No'}`,
                `Last message: ${data.message}`,
                `Date: ${data.timestamp}`
            ],
            summary: data.message.substring(0, 140),
            counters: { messages_sent: 1 }
        });
        logger.info('💾 Instagram message saved to memory:', data.username);
    }
    catch (error) {
        logger.error('❌ Error saving to memory:', error);
    }
}
/**
 * Analyze sentiment (reuse WhatsApp function)
 */
async function analyzeSentiment(text) {
    try {
        const prompt = `Analyze sentiment of this Instagram DM. Return JSON only:
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
        const responseData = response.data || response;
        const result = JSON.parse(responseData.response || responseData.answer || '{"score":5,"label":"neutral","urgency":"low"}');
        return result;
    }
    catch (error) {
        logger.error('❌ Sentiment analysis error:', error);
        return { score: 5, label: 'neutral', urgency: 'low' };
    }
}
/**
 * Update Instagram user profile
 */
async function updateInstagramUserProfile(userId, username, message, sentiment, userInfo) {
    try {
        if (!instagramUsers.has(userId)) {
            instagramUsers.set(userId, {
                userId,
                username,
                name: userInfo.name,
                profilePic: userInfo.profile_pic,
                followerCount: userInfo.follower_count || 0,
                isVerified: userInfo.is_verified || false,
                sentimentHistory: [],
                topicsAsked: [],
                engagementScore: 0,
                leadScore: calculateLeadScore(userInfo, message),
                lastActive: new Date().toISOString()
            });
        }
        const user = instagramUsers.get(userId);
        user.sentimentHistory.push({
            date: new Date().toISOString(),
            score: sentiment.score,
            message: message.substring(0, 100)
        });
        user.lastActive = new Date().toISOString();
        user.engagementScore += 1;
        // Update lead score based on engagement
        user.leadScore = calculateLeadScore(userInfo, message, user.engagementScore);
        logger.info(`📊 User profile updated: @${username} (lead score: ${user.leadScore})`);
    }
    catch (error) {
        logger.error('❌ Error updating user profile:', error);
    }
}
/**
 * Calculate lead score based on user info and message
 */
function calculateLeadScore(userInfo, message, engagementScore = 0) {
    let score = 50; // Base score
    // Follower count (influence)
    const followers = userInfo.follower_count || 0;
    if (followers > 10000)
        score += 20;
    else if (followers > 1000)
        score += 10;
    else if (followers > 100)
        score += 5;
    // Verified account
    if (userInfo.is_verified)
        score += 15;
    // Message intent
    const urgentKeywords = ['urgent', 'asap', 'now', 'today', 'subito', 'segera'];
    const buyingKeywords = ['price', 'cost', 'quanto', 'berapa', 'buy', 'purchase', 'payment'];
    if (urgentKeywords.some(kw => message.toLowerCase().includes(kw)))
        score += 20;
    if (buyingKeywords.some(kw => message.toLowerCase().includes(kw)))
        score += 15;
    // Engagement (repeat customer)
    if (engagementScore > 5)
        score += 10;
    if (engagementScore > 10)
        score += 15;
    return Math.min(100, Math.max(0, score));
}
/**
 * Smart decision: Should ZANTARA respond on Instagram?
 */
async function shouldZantaraRespondInstagram(params) {
    const { message, sentiment, userInfo } = params;
    // Rule 1: Always respond to questions
    if (message.includes('?')) {
        return { respond: true, reason: 'Question asked' };
    }
    // Rule 2: High-value leads (verified or high followers)
    if (userInfo.is_verified || (userInfo.follower_count || 0) > 1000) {
        return { respond: true, reason: 'High-value lead (verified/influencer)' };
    }
    // Rule 3: Urgent or negative sentiment
    if (sentiment.urgency === 'high' || sentiment.score < 4) {
        return { respond: true, reason: 'Urgent or negative sentiment' };
    }
    // Rule 4: Service keywords
    const keywords = ['kbli', 'pt pma', 'visa', 'kitas', 'tax', 'npwp', 'company', 'business', 'bali'];
    const hasKeyword = keywords.some(kw => message.toLowerCase().includes(kw));
    if (hasKeyword) {
        return { respond: true, reason: 'Service keyword detected' };
    }
    // Rule 5: Don't respond to generic greetings
    const greetings = ['hi', 'hello', 'ciao', 'halo', 'hey'];
    if (greetings.includes(message.toLowerCase().trim())) {
        return { respond: false, reason: 'Generic greeting' };
    }
    // Default: respond to build engagement
    return { respond: true, reason: 'Building engagement' };
}
/**
 * Send intelligent Instagram response
 */
export function buildInstagramPrompt(context, recentContext, userMessage) {
    return `You are ZANTARA, Bali Zero's AI assistant for Indonesian business setup.

Platform: Instagram DM
User: @${context.username} ${context.userInfo?.is_verified ? '✓ Verified' : ''}
Followers: ${context.userInfo?.follower_count || 0}
Sentiment: ${context.sentiment?.label} (${context.sentiment?.score}/10)

Recent context: ${recentContext}

User message: "${userMessage}"

Respond professionally but friendly (Instagram style, max 2 short paragraphs). Include relevant info about PT PMA, KITAS, or pricing if asked. Use emojis sparingly. Language: match user's language (ID/EN/IT).`;
}
async function sendIntelligentInstagramResponse(to, userMessage, context) {
    try {
        // Retrieve user memory
        const memoryRes = await memorySearch({
            userId: `instagram_${to}`,
            query: userMessage,
            limit: 3
        });
        const recentContext = Array.isArray(memoryRes?.data?.memories) && memoryRes.data.memories.length > 0
            ? memoryRes.data.memories.map((m) => m?.content).filter(Boolean).slice(0, 3).join(' | ')
            : 'First interaction';
        // Build context-aware prompt
        const prompt = buildInstagramPrompt(context, recentContext, userMessage);
        const aiResponse = await aiChat({
            prompt,
            max_tokens: 250,
            model: 'claude-3-5-haiku-20241022'
        });
        const responseData = aiResponse.data || aiResponse;
        const responseText = responseData.response || responseData.answer || 'Ciao! Come posso aiutarti con i servizi Bali Zero? 🌴';
        // Send via Instagram API
        await sendInstagramMessage(to, responseText);
        logger.info(`✅ Instagram response sent to @${context.username}`);
    }
    catch (error) {
        logger.error('❌ Error sending Instagram response:', error);
    }
}
/**
 * Send Instagram message via Meta API
 */
async function sendInstagramMessage(to, text) {
    try {
        const url = `${INSTAGRAM_CONFIG.baseUrl}/me/messages`;
        const response = await axios.post(url, {
            recipient: { id: to },
            message: { text: text }
        }, {
            headers: {
                'Authorization': `Bearer ${INSTAGRAM_CONFIG.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        logger.info('📤 Instagram message sent:', response.data);
        return response.data;
    }
    catch (error) {
        logger.error('❌ Error sending Instagram message:', error.response?.data || error.message);
        throw error;
    }
}
/**
 * Check for alerts and notify team
 */
async function checkInstagramAlerts(params) {
    const { userId: _userId, username, message, sentiment, userInfo } = params;
    const alerts = [];
    // Alert 1: High-value lead (verified or influencer)
    if (userInfo.is_verified || (userInfo.follower_count || 0) > 5000) {
        alerts.push({
            type: 'high_value_lead',
            severity: 'high',
            message: `💎 VIP Lead: @${username} (${userInfo.follower_count} followers, ${userInfo.is_verified ? 'verified' : 'not verified'}): "${message}"`
        });
    }
    // Alert 2: Negative sentiment
    if (sentiment.score < 4) {
        alerts.push({
            type: 'negative_sentiment',
            severity: 'medium',
            message: `⚠️ @${username} has negative sentiment (${sentiment.score}/10): "${message}"`
        });
    }
    // Alert 3: Buying intent
    const buyingKeywords = ['price', 'cost', 'quanto', 'berapa', 'payment', 'invoice', 'start'];
    if (buyingKeywords.some(kw => message.toLowerCase().includes(kw))) {
        alerts.push({
            type: 'buying_intent',
            severity: 'high',
            message: `💰 @${username} showing buying intent: "${message}"`
        });
    }
    // Send alerts to team
    for (const alert of alerts) {
        logger.info(`🚨 INSTAGRAM ALERT [${alert.severity}]:`, alert.message);
        // Send to Slack/Discord
        try {
            await sendTeamAlert(alert);
        }
        catch (error) {
            logger.error('❌ Failed to send Instagram alert:', error);
        }
    }
}
/**
 * Send alert to team via Slack/Discord webhooks
 */
async function sendTeamAlert(alert) {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    if (!slackWebhook && !discordWebhook) {
        logger.info('⚠️ No webhook URLs configured (SLACK_WEBHOOK_URL or DISCORD_WEBHOOK_URL)');
        return;
    }
    const message = {
        text: `📸 **INSTAGRAM ${alert.type.toUpperCase()}** [${alert.severity}]\n\n${alert.message}`,
        attachments: [{
                color: alert.severity === 'high' ? 'danger' : 'warning',
                fields: [
                    { title: 'Platform', value: 'Instagram', short: true },
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
            logger.info('✅ Instagram alert sent to Slack');
        }
        catch (error) {
            logger.error('❌ Slack webhook failed:', error.message);
        }
    }
    // Send to Discord
    if (discordWebhook) {
        try {
            const discordMessage = {
                content: `📸 **INSTAGRAM ${alert.type.toUpperCase()}** [${alert.severity}]`,
                embeds: [{
                        description: alert.message,
                        color: alert.severity === 'high' ? 15158332 : 16776960,
                        timestamp: new Date().toISOString()
                    }]
            };
            await axios.post(discordWebhook, discordMessage);
            logger.info('✅ Instagram alert sent to Discord');
        }
        catch (error) {
            logger.error('❌ Discord webhook failed:', error.message);
        }
    }
}
/**
 * Get Instagram user analytics
 */
export async function getInstagramUserAnalytics(params) {
    const { userId } = params;
    if (!userId) {
        throw new BadRequestError('userId is required');
    }
    const user = instagramUsers.get(userId);
    if (!user) {
        return ok({
            message: 'User not found or no data yet',
            userId
        });
    }
    const avgSentiment = user.sentimentHistory.length > 0
        ? user.sentimentHistory.reduce((sum, h) => sum + h.score, 0) / user.sentimentHistory.length
        : 0;
    return ok({
        userId: user.userId,
        username: user.username,
        profile: {
            name: user.name,
            followers: user.followerCount,
            verified: user.isVerified,
            profilePic: user.profilePic
        },
        engagement: {
            totalMessages: user.engagementScore,
            avgSentiment: avgSentiment.toFixed(1),
            leadScore: user.leadScore,
            lastActive: user.lastActive
        },
        sentimentHistory: user.sentimentHistory.slice(-10), // Last 10 messages
        topicsAsked: user.topicsAsked
    });
}
/**
 * Send manual Instagram message (for testing or proactive outreach)
 */
export async function sendManualInstagramMessage(params) {
    const { to, message } = params;
    if (!to || !message) {
        throw new BadRequestError('to and message are required');
    }
    await sendInstagramMessage(to, message);
    return ok({
        sent: true,
        to,
        message,
        platform: 'instagram',
        timestamp: new Date().toISOString()
    });
}

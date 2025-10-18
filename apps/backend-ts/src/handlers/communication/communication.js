import { BadRequestError, InternalServerError } from "../../utils/errors.js";
import { ok } from "../../utils/response.js";
/**
 * Slack webhook notification handler
 */
export async function slackNotify(params) {
    const { text, channel, attachments, webhook_url } = params || {};
    if (!text && !attachments) {
        throw new BadRequestError('text or attachments required');
    }
    const url = webhook_url || process.env.SLACK_WEBHOOK_URL;
    if (!url) {
        throw new InternalServerError('SLACK_WEBHOOK_URL not configured');
    }
    const payload = { text };
    if (channel)
        payload.channel = channel;
    if (attachments)
        payload.attachments = attachments;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new InternalServerError(`Slack webhook failed: ${response.statusText}`);
        }
        return ok({ sent: true, ts: Date.now() });
    }
    catch (error) {
        throw new InternalServerError(`Slack notification failed: ${error.message}`);
    }
}
export async function discordNotify(params) {
    const { content, embeds, username, avatar_url, webhook_url } = params || {};
    if (!content && !embeds) {
        throw new BadRequestError('content or embeds required');
    }
    const url = webhook_url || process.env.DISCORD_WEBHOOK_URL;
    if (!url) {
        throw new InternalServerError('DISCORD_WEBHOOK_URL not configured');
    }
    const payload = {};
    if (content)
        payload.content = content;
    if (embeds)
        payload.embeds = embeds;
    if (username)
        payload.username = username;
    if (avatar_url)
        payload.avatar_url = avatar_url;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new InternalServerError(`Discord webhook failed: ${errorText}`);
        }
        return ok({ sent: true, ts: Date.now() });
    }
    catch (error) {
        throw new InternalServerError(`Discord notification failed: ${error.message}`);
    }
}
export async function googleChatNotify(params) {
    const { text, space, thread: _thread, cards } = params || {};
    if (!text && !cards) {
        throw new BadRequestError('text or cards required');
    }
    // For now, use webhook approach (simpler)
    const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
    if (!webhookUrl) {
        // If no webhook, check if space is provided for API approach
        if (!space) {
            throw new BadRequestError('Either webhook_url or space parameter required');
        }
        throw new InternalServerError('Google Chat webhook not configured and API approach not yet implemented');
    }
    const payload = { text };
    if (cards)
        payload.cards = cards;
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new InternalServerError(`Google Chat webhook failed: ${response.statusText}`);
        }
        return ok({
            sent: true,
            method: 'webhook',
            ts: Date.now()
        });
    }
    catch (error) {
        throw new InternalServerError(`Google Chat notification failed: ${error.message}`);
    }
}

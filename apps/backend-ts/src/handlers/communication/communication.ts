import { BadRequestError, InternalServerError } from "../../utils/errors.js";
import { ok } from "../../utils/response.js";

type SlackAttachment = {
  color?: string;
  pretext?: string;
  text?: string;
  fields?: Array<{ title: string; value: string; short?: boolean }>;
};

interface SlackParams {
  text?: string;
  channel?: string;
  attachments?: SlackAttachment[];
  webhook_url?: string;
}

/**
 * Slack webhook notification handler
 */
export async function slackNotify(params: SlackParams) {
  const { text, channel, attachments, webhook_url } = params || {} as SlackParams;

  if (!text && !attachments) {
    throw new BadRequestError('text or attachments required');
  }

  const url = webhook_url || process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    throw new InternalServerError('SLACK_WEBHOOK_URL not configured');
  }

  const payload: { text?: string; channel?: string; attachments?: SlackAttachment[] } = { text };
  if (channel) payload.channel = channel;
  if (attachments) payload.attachments = attachments;

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
  } catch (error: any) {
    throw new InternalServerError(`Slack notification failed: ${error.message}`);
  }
}

/**
 * Discord webhook notification handler
 */
type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
};

interface DiscordParams {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
  webhook_url?: string;
}

export async function discordNotify(params: DiscordParams) {
  const { content, embeds, username, avatar_url, webhook_url } = params || {} as DiscordParams;

  if (!content && !embeds) {
    throw new BadRequestError('content or embeds required');
  }

  const url = webhook_url || process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    throw new InternalServerError('DISCORD_WEBHOOK_URL not configured');
  }

  const payload: { content?: string; embeds?: DiscordEmbed[]; username?: string; avatar_url?: string } = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;
  if (username) payload.username = username;
  if (avatar_url) payload.avatar_url = avatar_url;

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
  } catch (error: any) {
    throw new InternalServerError(`Discord notification failed: ${error.message}`);
  }
}

/**
 * Google Chat notification handler
 */
// Minimal Google Chat Card type (subset)
type GoogleChatCard = {
  header?: { title?: string; subtitle?: string; imageUrl?: string };
  sections?: Array<{
    header?: string;
    widgets?: Array<any>;
  }>;
};

interface GoogleChatParams {
  text?: string;
  space?: string;
  thread?: string;
  cards?: GoogleChatCard[];
}

export async function googleChatNotify(params: GoogleChatParams) {
  const { text, space, thread: _thread, cards } = params || {} as GoogleChatParams;

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

  const payload: { text?: string; cards?: GoogleChatCard[] } = { text };
  if (cards) payload.cards = cards;

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
  } catch (error: any) {
    throw new InternalServerError(`Google Chat notification failed: ${error.message}`);
  }
}

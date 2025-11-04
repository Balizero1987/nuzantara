import Bridge from '../bridge.js';
export async function handleChatWebhook(req, res) {
    console.log('🪷 Google Chat webhook received:', JSON.stringify(req.body, null, 2));
    const { type, message, space, user } = req.body;
    // Handle bot being added to space
    if (type === 'ADDED_TO_SPACE') {
        return res.json({
            text: `🌸 **ZANTARA** is now online in ${space?.displayName || 'this space'}!

🧠 **Available AI Models:**
• Google Gemini (1.5 Flash)
• Anthropic Claude (Haiku)
• OpenAI GPT-4
• Cohere Command-R

🔧 **Workspace Integration:**
• Gmail (send/read emails)
• Google Drive (upload/list files)
• Google Calendar (create/list events)
• Memory system with intelligent search

📢 **Communication:**
• Slack notifications
• Discord webhooks
• Google Chat messages

Just @ mention me or use commands like:
\`/memory search [query]\`
\`/ai chat [prompt]\`
\`/drive upload [content]\`
\`/calendar create [event]\`

Ready to assist! 🚀`,
            cards: [{
                    header: {
                        title: 'ZANTARA AI Assistant',
                        subtitle: 'Powered by Multi-AI Orchestra',
                        imageUrl: 'https://zantara-bridge-v2-prod-1064094238013.europe-west1.run.app/assets/zantara-logo-512.png'
                    },
                    sections: [{
                            widgets: [{
                                    keyValue: {
                                        topLabel: 'Status',
                                        content: '🟢 Online & Ready'
                                    }
                                }, {
                                    keyValue: {
                                        topLabel: 'AI Models',
                                        content: 'Gemini • Claude • GPT-4 • Cohere'
                                    }
                                }]
                        }]
                }]
        });
    }
    // Handle removed from space
    if (type === 'REMOVED_FROM_SPACE') {
        console.log('🪷 ZANTARA removed from space:', space?.displayName);
        return res.json({});
    }
    // Handle messages
    if (type === 'MESSAGE') {
        const text = message?.text || '';
        const messageId = message?.name || 'unknown';
        const userName = user?.displayName || 'User';
        console.log(`🪷 Processing message from ${userName}: "${text}"`);
        try {
            // Initialize bridge
            const bridge = new Bridge();
            // Clean the message text (remove @ZANTARA mentions)
            const cleanText = text.replace(/@ZANTARA/gi, '').trim();
            if (!cleanText) {
                return res.json({
                    text: '🌸 Hi! How can I help you today?',
                    thread: message.thread
                });
            }
            // Parse slash commands
            if (cleanText.startsWith('/')) {
                return await handleSlashCommand(cleanText, bridge, res, message);
            }
            // Regular AI chat
            const response = await bridge.call({
                key: 'ai.chat',
                params: {
                    prompt: cleanText,
                    context: `You are ZANTARA, an AI assistant integrated into ${space?.displayName || 'Google Workspace'}.

You have access to:
- Multiple AI models (Gemini, Claude, GPT-4, Cohere)
- Google Workspace (Gmail, Drive, Calendar)
- Memory system for user data
- Communication tools (Slack, Discord)

Respond helpfully and mention available features when relevant. Keep responses concise but informative.

User: ${userName}
Space: ${space?.displayName || 'Direct Message'}`
                }
            });
            const aiResponse = response.result?.response || response.response || 'Processing...';
            return res.json({
                text: `🌸 ${aiResponse}`,
                thread: message.thread
            });
        }
        catch (error) {
            console.error('🪷 Chat webhook error:', error);
            return res.json({
                text: `❌ Error: ${error.message}\n\nPlease try again or contact support.`,
                thread: message.thread
            });
        }
    }
    // Handle unknown event types
    console.log('🪷 Unknown event type:', type);
    return res.json({ text: 'Event received' });
}
async function handleSlashCommand(command, bridge, res, message) {
    const [cmd, ...args] = command.split(' ');
    const params = args.join(' ');
    switch (cmd.toLowerCase()) {
        case '/memory':
            if (args[0] === 'search' && args[1]) {
                const query = args.slice(1).join(' ');
                const response = await bridge.call({
                    key: 'memory.search',
                    params: { query, limit: 5 }
                });
                const results = response.result?.results || [];
                const resultText = results.length > 0
                    ? results.map((r, i) => `${i + 1}. **${r.userId}**: ${r.summary || r.facts?.join(', ') || 'No details'}`).join('\n')
                    : 'No memories found for that query.';
                return res.json({
                    text: `🧠 **Memory Search Results for "${query}":**\n\n${resultText}`,
                    thread: message.thread
                });
            }
            break;
        case '/ai':
            if (args[0] === 'chat' && args[1]) {
                const prompt = args.slice(1).join(' ');
                const response = await bridge.call({
                    key: 'ai.chat',
                    params: { prompt }
                });
                return res.json({
                    text: `🤖 ${response.result?.response || response.response}`,
                    thread: message.thread
                });
            }
            break;
        case '/drive':
            if (args[0] === 'upload' && args[1]) {
                const content = args.slice(1).join(' ');
                const response = await bridge.call({
                    key: 'drive.upload',
                    params: {
                        requestBody: { name: `zantara-note-${Date.now()}.txt` },
                        media: { body: content, mimeType: 'text/plain' }
                    }
                });
                const file = response.result?.file || {};
                return res.json({
                    text: `📁 **File uploaded to Drive:**\n[${file.name}](${file.webViewLink})`,
                    thread: message.thread
                });
            }
            break;
        case '/help':
            return res.json({
                text: `🌸 **ZANTARA Commands:**

**Memory:**
\`/memory search [query]\` - Search stored memories

**AI Chat:**
\`/ai chat [prompt]\` - Direct AI conversation

**Google Drive:**
\`/drive upload [content]\` - Upload text to Drive

**Direct Features:**
Just mention me with any request - I'll use the best AI model and tools automatically!

**Available AI Models:** Gemini, Claude, GPT-4, Cohere`,
                thread: message.thread
            });
        default:
            return res.json({
                text: `❓ Unknown command: ${cmd}\n\nTry \`/help\` for available commands.`,
                thread: message.thread
            });
    }
    return res.json({
        text: `❓ Invalid command format. Try \`/help\` for usage examples.`,
        thread: message.thread
    });
}

// 💬 ZANTARA Chat Widget Component

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types/gamification';
import { ZantaraChat, ChatMessage } from '../services/zantaraChat';

interface ZantaraChatWidgetProps {
  userId: string;
  userProfile: UserProfile;
}

export const ZantaraChatWidget: React.FC<ZantaraChatWidgetProps> = ({
  userId,
  userProfile
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [zantara] = useState(() => new ZantaraChat({
    userId,
    sessionId: `session_${Date.now()}`,
    userProfile
  }));

  useEffect(() => {
    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Ciao ${userProfile.displayName}! Sono ZANTARA, la tua AI companion!\n\nPosso aiutarti con:\n🎯 Quest e task\n🤖 Status degli agenti\n📊 Analytics\n🔍 Ricerca nella knowledge base\n\nCosa vuoi fare?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await zantara.sendMessage(userMessage);
      setMessages(prev => [...prev, ...zantara.getHistory().slice(-2)]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '😅 Oops! Something went wrong. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Mostrami le quest', query: 'Quali quest posso fare?' },
    { label: 'Status agenti', query: 'Come stanno gli agenti?' },
    { label: 'Le mie attività', query: 'Mostrami le mie quest attive' },
    { label: 'Help', query: 'Aiuto' }
  ];

  return (
    <div className={`zantara-chat-widget ${isExpanded ? 'expanded' : 'compact'}`}>
      <div className="chat-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="chat-header-title">
          <span className="zantara-icon">🤖</span>
          <span>ZANTARA</span>
        </div>
        <button className="expand-button">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <div className="message-avatar">🤖</div>
                )}
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  {/* Quest suggestions */}
                  {msg.metadata?.questSuggestions && msg.metadata.questSuggestions.length > 0 && (
                    <div className="quest-suggestions">
                      {msg.metadata.questSuggestions.slice(0, 3).map((quest: any) => (
                        <div key={quest.id} className="quest-suggestion-card">
                          <strong>{quest.title}</strong>
                          <span className="xp">⭐ {quest.xpReward} XP</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="message-avatar user">
                    {userProfile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="quick-actions">
            {quickActions.map((action, i) => (
              <button
                key={i}
                className="quick-action-btn"
                onClick={() => {
                  setInputValue(action.query);
                  setTimeout(() => handleSend(), 100);
                }}
                disabled={isLoading}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask ZANTARA anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
            >
              ➤
            </button>
          </div>
        </>
      )}
    </div>
  );
};

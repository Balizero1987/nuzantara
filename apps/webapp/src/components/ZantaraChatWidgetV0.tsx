// 🎮 ZANTARA Chat Widget - v0.dev UI integrated with TeachingEngine

import { useState, useRef, useEffect } from 'react';
import { UserLevel } from '../types/gamification';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ZantaraChatWidgetV0Props {
  userLevel: UserLevel;
  onSendMessage?: (message: string) => Promise<string>;
}

export default function ZantaraChatWidgetV0({ userLevel, onSendMessage }: ZantaraChatWidgetV0Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Ciao! 👋 Sono ZANTARA, il tuo assistente AI per l\'onboarding. Come posso aiutarti oggi?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      let response: string;

      if (onSendMessage) {
        // Use provided handler (connects to teachingEngine or zantaraChat)
        response = await onSendMessage(messageText);
      } else {
        // Fallback response
        response = 'Continua a esplorare la dashboard per sbloccare nuove funzionalità! 🚀';
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Ops, ho avuto un problema. Riprova!',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    'Mostra Suggerimenti',
    'Controlla Progresso',
    'Insegnami Qualcosa'
  ];

  const handleQuickAction = (action: string) => {
    setInputValue(action);
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <h3 className="font-bold text-white text-lg">ZANTARA</h3>
        <p className="text-xs text-white/80">Assistente AI per l'Onboarding</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                message.sender === 'user'
                  ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                  : 'bg-gradient-to-br from-orange-400 to-orange-600'
              }`}
            >
              {message.sender === 'user' ? '👤' : '✨'}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-xs rounded-lg px-4 py-3 ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-br-none'
                  : 'backdrop-blur-lg bg-white/10 border border-white/20 text-white rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm">
              ✨
            </div>
            <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-lg px-4 py-3 rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-2 flex-wrap">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-all border border-white/20 disabled:opacity-50"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSendMessage} className="px-4 py-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Scrivi un messaggio..."
            disabled={isLoading}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Invia
          </button>
        </div>
      </form>
    </div>
  );
}

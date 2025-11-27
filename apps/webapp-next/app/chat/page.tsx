"use client"

import { Send, Bot, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    id?: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input.trim(), id: Date.now().toString() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('zantara_token');
            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });

            if (!response.ok) {
                throw new Error('Chat request failed');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No reader available');
            }

            const decoder = new TextDecoder();
            let assistantContent = '';
            const assistantMessage: ChatMessage = { role: 'assistant', content: '', id: (Date.now() + 1).toString() };
            setMessages(prev => [...prev, assistantMessage]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;
                
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = assistantContent;
                    }
                    return updated;
                });
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.', id: Date.now().toString() }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#2B2B2B] text-white font-sans">
            {/* Header */}
            <header className="flex items-center p-4 border-b border-gray-700 bg-[#3a3a3a]">
                <Link href="/dashboard" className="p-2 hover:bg-gray-700 rounded-full transition-colors mr-4">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center border border-red-500/50">
                        <Bot className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h1 className="font-bold font-serif tracking-wide">Zantara Core</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-400 font-mono">ONLINE</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <Bot className="w-16 h-16 mb-4" />
                        <p className="font-serif text-lg">Awaiting input...</p>
                    </div>
                )}

                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-blue-600' : 'bg-red-900/50 border border-red-500/30'
                                }`}>
                                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-red-500" />}
                            </div>

                            <div className={`p-4 rounded-2xl ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-[#3a3a3a] border border-gray-700 text-gray-100 rounded-tl-none'
                                }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#3a3a3a] border-t border-gray-700">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
                    <input
                        className="w-full bg-[#2B2B2B] border border-gray-600 rounded-xl py-4 pl-6 pr-14 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-sans"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Execute command or query knowledge base..."
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!input.trim() || isLoading}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

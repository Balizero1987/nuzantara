import React, { useState, useEffect } from 'react';

const THINKING_MESSAGES = [
    "Consulting Knowledge Base...",
    "Analyzing regulations...",
    "Formulating answer...",
    "Connecting to Oracle...",
    "Synthesizing context..."
];

export function ThinkingIndicator() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-1">
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                />
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                />
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                />
            </div>
            <span className="text-sm text-gray-400 animate-pulse min-w-[180px]">
                {THINKING_MESSAGES[messageIndex]}
            </span>
        </div>
    );
}

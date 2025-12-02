import React, { useState, useEffect } from 'react';

const THINKING_MESSAGES = [
    "Memahami pertanyaan Anda...",
    "Mencari informasi terkait...",
    "Menganalisis konteks...",
    "Menyusun jawaban terbaik...",
    "Menghubungkan data...",
    "Sedang berpikir...",
];

// Get random message but avoid immediate repetition
const getRandomMessage = (currentIndex: number, messages: string[]): number => {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * messages.length);
    } while (newIndex === currentIndex && messages.length > 1);
    return newIndex;
};

// Get natural random delay between 1.5-3 seconds
const getRandomDelay = () => 1500 + Math.random() * 1500;

export function ThinkingIndicator() {
    const [messageIndex, setMessageIndex] = useState(() =>
        Math.floor(Math.random() * THINKING_MESSAGES.length)
    );

    useEffect(() => {
        const scheduleNext = () => {
            const delay = getRandomDelay();
            return setTimeout(() => {
                setMessageIndex((prev) => getRandomMessage(prev, THINKING_MESSAGES));
            }, delay);
        };

        const timeoutId = scheduleNext();

        return () => clearTimeout(timeoutId);
    }, [messageIndex]); // Re-run when messageIndex changes to schedule next update

    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-1">
                <div
                    className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                />
                <div
                    className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                />
                <div
                    className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                />
            </div>
            <span className="text-sm text-gray-300 transition-opacity duration-300 min-w-[200px]">
                {THINKING_MESSAGES[messageIndex]}
            </span>
        </div>
    );
}

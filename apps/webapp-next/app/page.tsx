"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("zero@balizero.com");
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(false);

        try {
            // Get backend URL from environment
            const RAG_BACKEND_URL = process.env.NEXT_PUBLIC_RAG_BACKEND_URL || process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
            
            // Call real authentication endpoint
            const response = await fetch(`${RAG_BACKEND_URL}/api/auth/team/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, pin }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Authentication failed' }));
                setError(true);
                setIsLoading(false);
                return;
            }

            const data = await response.json();

            // Save token to localStorage
            if (data.token) {
                localStorage.setItem('zantara_token', data.token);
                // Also save user data if needed
                if (data.user) {
                    localStorage.setItem('zantara_user', JSON.stringify(data.user));
                }
                
                // Redirect to dashboard on success
                router.push('/dashboard');
            } else {
                setError(true);
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(true);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#3a3a3a] font-sans p-4">

            {/* Logo Container */}
            <div className="w-full max-w-[300px] mb-8 animate-pulse-subtle relative h-24">
                <Image
                    src="/images/logo1-zantara.svg"
                    alt="Zantara Indonesia AI"
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                />
            </div>

            {/* Login Card */}
            <div
                className={`w-full max-w-[420px] bg-[#505050] backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-600 p-8 animate-fade-in ${error ? "animate-shake" : ""
                    }`}
            >
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Email Input */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-xs font-bold text-white/90 tracking-widest uppercase font-serif">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#404040] text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all placeholder-white/30 font-serif"
                            required
                        />
                    </div>

                    {/* PIN Input */}
                    <div className="space-y-2">
                        <label htmlFor="pin" className="block text-xs font-bold text-white/90 tracking-widest uppercase font-serif">
                            Access PIN
                        </label>
                        <div className="relative">
                            <input
                                type={showPin ? "text" : "password"}
                                id="pin"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full px-4 py-3 bg-[#404040] text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500 transition-all pr-12 placeholder-white/30 font-serif tracking-widest"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                            >
                                {showPin ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="text-right pt-1">
                            <a href="#" className="text-xs text-[#d4af37] hover:text-[#f0c75e] transition-colors font-serif italic tracking-wide">
                                Forgot PIN?
                            </a>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#404040] text-white py-3.5 rounded-lg font-bold text-xl hover:bg-[#4a4a4a] hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 flex items-center justify-center gap-2 shadow-lg font-serif tracking-wide"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Authenticating...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center text-xs text-white/40 tracking-wide font-serif">
                © 2025 Zero AI
            </div>
        </div>
    );
}

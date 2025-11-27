"use client"

import React, { useEffect, useState } from 'react';
import { Shield, Activity, MessageSquare, Users, Server, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
    const [stats, setStats] = useState({
        active_agents: 0,
        system_health: "Checking...",
        uptime_status: "CONNECTING...",
        knowledge_base: {
            vectors: "...",
            status: "..."
        }
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // In a real deployment, this would be an absolute URL or proxied
                // For local dev, we hit the backend directly (CORS allowed)
                const res = await fetch('http://localhost:8000/api/dashboard/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch dashboard stats", e);
                setStats(prev => ({ ...prev, uptime_status: "OFFLINE", system_health: "ERROR" }));
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#2B2B2B] text-white font-sans p-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-12 border-b border-gray-700 pb-6">
                <div className="flex items-center gap-4">
                    <Shield className="w-8 h-8 text-red-600" />
                    <h1 className="text-2xl font-bold tracking-widest uppercase font-serif">Zantara Mission Control</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 bg-[#3a3a3a] rounded-full border ${stats.uptime_status === 'ONLINE' ? 'border-green-900' : 'border-red-900'}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${stats.uptime_status === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-mono ${stats.uptime_status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>SYSTEM {stats.uptime_status}</span>
                    </div>
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* Active Agents Card */}
                <div className="bg-[#3a3a3a] p-6 rounded-2xl border border-gray-600 shadow-xl hover:border-red-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-[#2B2B2B] rounded-xl border border-gray-700 group-hover:border-red-500/50 transition-colors">
                            <Cpu className="w-6 h-6 text-red-500" />
                        </div>
                        <span className="text-xs font-mono text-gray-400">NODE_01</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 font-serif">Active Agents</h3>
                    <p className="text-3xl font-mono text-white mb-2">{stats.active_agents}</p>
                    <p className="text-xs text-gray-400">Orchestrating workflows</p>
                </div>

                {/* System Health Card */}
                <div className="bg-[#3a3a3a] p-6 rounded-2xl border border-gray-600 shadow-xl hover:border-green-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-[#2B2B2B] rounded-xl border border-gray-700 group-hover:border-green-500/50 transition-colors">
                            <Activity className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="text-xs font-mono text-gray-400">UPTIME</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 font-serif">System Health</h3>
                    <p className="text-3xl font-mono text-green-400 mb-2">{stats.system_health}</p>
                    <p className="text-xs text-gray-400">All systems nominal</p>
                </div>

                {/* Secure Chat Card - LINK TO CHAT */}
                <Link href="/chat" className="bg-[#3a3a3a] p-6 rounded-2xl border border-gray-600 shadow-xl hover:border-blue-500/30 transition-all group cursor-pointer block">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-[#2B2B2B] rounded-xl border border-gray-700 group-hover:border-blue-500/50 transition-colors">
                            <MessageSquare className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-xs font-mono text-gray-400">ENCRYPTED</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 font-serif">Secure Chat</h3>
                    <p className="text-sm text-gray-300 mb-2 mt-2">Connect with Zantara Core</p>
                    <div className="mt-4 w-full py-2 bg-[#2B2B2B] text-center rounded-lg text-xs font-bold uppercase tracking-wider text-blue-400 border border-blue-900/30 group-hover:bg-blue-900/20 transition-all">
                        Initiate Link
                    </div>
                </Link>

                {/* Database Status */}
                <div className="bg-[#3a3a3a] p-6 rounded-2xl border border-gray-600 shadow-xl hover:border-yellow-500/30 transition-all group md:col-span-2 lg:col-span-3">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-[#2B2B2B] rounded-xl border border-gray-700 group-hover:border-yellow-500/50 transition-colors">
                            <Server className="w-6 h-6 text-yellow-500" />
                        </div>
                        <span className="text-xs font-mono text-gray-400">VECTOR_DB</span>
                    </div>
                    <h3 className="text-lg font-bold mb-4 font-serif">Knowledge Base Status</h3>
                    <div className="w-full bg-[#2B2B2B] rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-yellow-500 h-2 rounded-full w-[75%] animate-pulse"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                        <span>{stats.knowledge_base.status}</span>
                        <span>{stats.knowledge_base.vectors} Vectors</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

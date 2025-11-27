import Link from "next/link"
import { Shield, Activity, MessageSquare, Cpu } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#2B2B2B] text-white font-sans p-8">
      <header className="flex justify-between items-center mb-12 border-b border-gray-700 pb-6">
        <div className="flex items-center gap-4">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-bold tracking-widest uppercase font-serif">Zantara Mission Control</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#3a3a3a] rounded-full border border-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-[#3a3a3a] p-6 rounded-2xl border border-gray-600 shadow-xl hover:border-red-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#2B2B2B] rounded-xl border border-gray-700 group-hover:border-red-500/50 transition-colors">
              <Cpu className="w-6 h-6 text-red-500" />
            </div>
            <span className="text-xs font-mono text-gray-400">NODE_01</span>
          </div>
          <h3 className="text-lg font-bold mb-1 font-serif">Active Agents</h3>
          <p className="text-3xl font-mono text-white mb-2">3</p>
          <p className="text-xs text-gray-400">Orchestrating workflows</p>
        </div>

        <div className="bg-[#3a3a3a] p-6 rounded-2xl border border-gray-600 shadow-xl hover:border-green-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#2B2B2B] rounded-xl border border-gray-700 group-hover:border-green-500/50 transition-colors">
              <Activity className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-xs font-mono text-gray-400">UPTIME</span>
          </div>
          <h3 className="text-lg font-bold mb-1 font-serif">System Health</h3>
          <p className="text-3xl font-mono text-green-400 mb-2">99.9%</p>
          <p className="text-xs text-gray-400">All systems nominal</p>
        </div>

        <Link
          href="/chat"
          className="bg-[#3a3a3a] p-6 rounded-2xl border border-gray-600 shadow-xl hover:border-blue-500/30 transition-all group cursor-pointer block"
        >
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
      </div>
    </div>
  )
}

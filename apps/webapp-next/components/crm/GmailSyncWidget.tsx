"use client"

import { useState } from "react"
import { crmAPI } from "@/lib/api/crm"

export function GmailSyncWidget() {
  const [isSyncing, setIsSyncing] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setError(null)

    try {
      const syncResult = await crmAPI.syncGmail()
      setResult(syncResult)

      // Auto-hide success message after 5s
      setTimeout(() => setResult(null), 5000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Gmail sync failed")
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/90">Gmail CRM Sync</h3>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-3 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Sync Now</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs">
          <p className="text-green-400 font-medium mb-1">Sync successful!</p>
          <ul className="text-white/70 space-y-1">
            <li>{result.emails_processed} emails processed</li>
            <li>{result.new_clients} new clients created</li>
            <li>{result.new_interactions} interactions logged</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{error}</div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import type { ChatMetadata } from "@/lib/api/types"

interface RAGDrawerProps {
  metadata: ChatMetadata | undefined
  isOpen: boolean
  onClose: () => void
}

export function RAGDrawer({ metadata, isOpen, onClose }: RAGDrawerProps) {
  const [selectedSource, setSelectedSource] = useState<number | null>(null)

  if (!metadata || !metadata.rag_sources || metadata.rag_sources.length === 0) {
    return null
  }

  const { rag_sources } = metadata

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-[450px] bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] border-l border-[#d4af37]/20 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#d4af37] to-[#b8941f] rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Knowledge Sources</h2>
              <p className="text-xs text-gray-400">{rag_sources.length} documents used</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
            aria-label="Close drawer"
          >
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-88px)] p-6 space-y-4">
          {rag_sources.map((source, idx) => {
            const isSelected = selectedSource === idx
            const relevancePercent = (source.score || 0) * 100

            return (
              <div
                key={idx}
                onClick={() => setSelectedSource(isSelected ? null : idx)}
                className={`cursor-pointer rounded-xl border-2 transition-all duration-300 ${
                  isSelected
                    ? "border-[#d4af37] bg-[#d4af37]/5 shadow-lg shadow-[#d4af37]/20"
                    : "border-gray-800/50 bg-gray-900/30 hover:border-gray-700/50"
                }`}
              >
                {/* Source Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Collection Badge */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full mb-2">
                        <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-[#d4af37] uppercase tracking-wide">
                          {source.collection}
                        </span>
                      </div>

                      {/* Document Name */}
                      <h3 className="text-sm font-medium text-white mb-1 truncate">{source.document}</h3>

                      {/* Relevance Score */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Relevance</span>
                          <span className="text-[#d4af37] font-semibold">{relevancePercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#d4af37] via-[#f0c75e] to-[#d4af37] transition-all duration-500 ease-out relative"
                            style={{ width: `${relevancePercent}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                        isSelected ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Preview */}
                {isSelected && (
                  <div className="border-t border-gray-800/50 p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    {/* Document Icon */}
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-xs">Document Preview</span>
                    </div>

                    {/* Mock Preview Text */}
                    <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800/30">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {source.collection === "visa" &&
                          "Visa requirements for Indonesia: Tourist visas are available for citizens of most countries. The standard tourist visa allows stays up to 30 days and can be extended once for an additional 30 days..."}
                        {source.collection === "tax" &&
                          "Indonesian tax regulations: Corporate income tax rate is 22% for fiscal year 2024. Value Added Tax (VAT) is set at 11% for most goods and services. Special economic zones may offer reduced rates..."}
                        {source.collection === "legal" &&
                          "Legal framework for business operations: All foreign investments must comply with the Investment Law (Law No. 25 of 2007). Certain sectors have restrictions on foreign ownership percentages..."}
                        {source.collection === "kbli" &&
                          "Business classification codes (KBLI): This classification system categorizes all economic activities in Indonesia. Each business must register under the appropriate KBLI code for licensing..."}
                        {source.collection === "pricing" &&
                          "Service pricing structure: Tier-based pricing model offers different levels of access. Premium tiers include priority support and advanced features..."}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Last updated: 2024</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span>PDF Document</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

"use client"

import { useState } from "react"
import type { ChatMetadata } from "@/lib/api/types"

interface ContextWidgetProps {
  metadata: ChatMetadata
}

export function ContextWidget({ metadata }: ContextWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { memory_used, rag_sources, intent } = metadata

  if (!memory_used && (!rag_sources || rag_sources.length === 0) && !intent) {
    return null
  }

  const visibleSources = isExpanded ? rag_sources : rag_sources?.slice(0, 2)

  const intentColors: Record<string, string> = {
    visa_inquiry: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    tax_query: "bg-green-500/20 text-green-400 border-green-500/30",
    legal_question: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    pricing_request: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    default: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }

  return (
    <div className="mb-2 w-fit max-w-sm bg-[#d4af37]/5 border-l-2 border-[#d4af37]/40 rounded-r-lg p-2 text-xs backdrop-blur-sm animate-fade-in">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1.5">
          {memory_used && (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <div className="relative">
                <svg className="w-3.5 h-3.5 text-[#d4af37]/70 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="text-gray-400 text-[11px]">Context memory active</span>
            </div>
          )}

          {intent && (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <svg className="w-3.5 h-3.5 text-[#d4af37]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-gray-400 text-[11px]">Intent:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                  intentColors[intent] || intentColors.default
                }`}
              >
                {intent.replace(/_/g, " ")}
              </span>
            </div>
          )}

          {rag_sources && rag_sources.length > 0 && (
            <div className="space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#d4af37]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="text-gray-400 text-[11px]">Sources ({rag_sources.length})</span>
              </div>

              <div className="ml-5 space-y-1">
                {visibleSources?.map((source, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 p-1.5 bg-gray-800/20 rounded border border-gray-700/20 hover:border-[#d4af37]/20 transition-colors group"
                  >
                    <svg
                      className="w-3 h-3 text-gray-500 group-hover:text-[#d4af37]/70 transition-colors flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-400 text-[10px] truncate">
                        <span className="text-[#d4af37]/80 font-medium">{source.collection}</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span>{source.document}</span>
                      </div>
                      {source.score && (
                        <div className="mt-0.5">
                          <div className="h-0.5 bg-gray-700/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#d4af37]/80 to-[#f0c75e]/80 transition-all duration-300"
                              style={{ width: `${source.score * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[#d4af37]/70">{(source.score * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {!isExpanded && rag_sources.length > 2 && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="flex items-center gap-1 text-[#d4af37]/70 hover:text-[#d4af37] text-[10px] transition-colors group"
                  >
                    <span>Show all {rag_sources.length}</span>
                    <svg
                      className="w-2.5 h-2.5 transition-transform group-hover:translate-y-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {isExpanded && rag_sources.length > 2 && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="flex items-center gap-1 text-[#d4af37]/70 hover:text-[#d4af37] text-[10px] transition-colors group"
                  >
                    <span>Show less</span>
                    <svg
                      className="w-2.5 h-2.5 transition-transform group-hover:-translate-y-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

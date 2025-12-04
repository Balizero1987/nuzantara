// src/app/chat/components/ChatInput.tsx
"use client"

import { useRef, useEffect } from "react"
import type { ChatInputProps } from "../types"

export function ChatInput({
  input,
  isLoading,
  uploadPreview,
  onInputChange,
  onSubmit,
  onKeyDown,
  onFileUpload,
  onClearPreview,
  onOpenImageModal,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  return (
    <div className="shrink-0 border-t border-white/5 p-4 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        {/* Upload Preview */}
        {uploadPreview && (
          <div className="px-6 pt-4 pb-2 animate-fade-in">
            <div className="relative inline-block group">
              <img
                src={uploadPreview}
                alt="Upload preview"
                className="h-20 w-20 object-cover rounded-lg border-2 border-gray-600 shadow-lg"
              />
              <button
                onClick={onClearPreview}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileUpload}
          className="hidden"
        />

        <form onSubmit={onSubmit}>
          <div className="relative group">
            <div className="relative rounded-3xl p-[1px]">
              <div className="relative flex items-center gap-3 rounded-3xl bg-gray-600/30 backdrop-blur-sm p-4 border border-gray-500/20">
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    placeholder="Ketik pesan Anda..."
                    className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 text-base leading-relaxed font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]"
                    rows={1}
                    disabled={isLoading}
                    style={{ minHeight: "32px", maxHeight: "120px" }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* Image Generation Button */}
                  <button
                    type="button"
                    onClick={onOpenImageModal}
                    disabled={isLoading}
                    className="h-10 w-10 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 hover:brightness-125 flex items-center justify-center"
                    aria-label="Generate image"
                  >
                    <img src="/images/imageb.svg" alt="" className="h-10 w-10 object-contain brightness-[1.6]" />
                  </button>

                  {/* File Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="h-10 w-10 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 hover:brightness-125 flex items-center justify-center"
                    aria-label="Upload file"
                  >
                    <img src="/images/file_botton.svg" alt="" className="h-10 w-10 object-contain brightness-[1.6]" />
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="h-10 w-10 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-95 hover:brightness-125 flex items-center justify-center"
                    aria-label="Send message"
                  >
                    <img src="/images/sendb.svg" alt="" className="h-10 w-10 object-contain brightness-[4.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

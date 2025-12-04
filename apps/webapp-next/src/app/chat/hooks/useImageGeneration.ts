// src/app/chat/hooks/useImageGeneration.ts
"use client"

import { useState, useCallback } from "react"
import { useChatStore } from "@/lib/store/chat-store"

export function useImageGeneration() {
  const [showImageModal, setShowImageModal] = useState(false)
  const [imagePrompt, setImagePrompt] = useState("")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  const { addMessage } = useChatStore()

  const handleGenerateImage = useCallback(async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return

    setIsGeneratingImage(true)

    try {
      // Add user message about image generation
      addMessage({
        id: `user_img_${Date.now()}`,
        role: "user",
        content: `Generate image: ${imagePrompt}`,
        timestamp: new Date(),
      })

      // Call image generation API
      const response = await fetch("/api/image/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      })

      if (!response.ok) {
        throw new Error("Image generation failed")
      }

      const data = await response.json()

      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl)

        // Add assistant message with generated image
        addMessage({
          id: `assistant_img_${Date.now()}`,
          role: "assistant",
          content: `Here's your generated image:\n\n![Generated Image](${data.imageUrl})\n\n*Prompt: ${imagePrompt}*`,
          timestamp: new Date(),
        })
      } else {
        throw new Error(data.error || "Image generation failed")
      }

      // Reset and close modal
      setImagePrompt("")
      setShowImageModal(false)
    } catch (error) {
      console.error("[ImageGeneration] Error:", error)

      // Add error message
      addMessage({
        id: `error_img_${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't generate the image. Please try again with a different prompt.",
        timestamp: new Date(),
      })
    } finally {
      setIsGeneratingImage(false)
    }
  }, [imagePrompt, isGeneratingImage, addMessage])

  const resetImageGeneration = useCallback(() => {
    setImagePrompt("")
    setGeneratedImageUrl(null)
    setShowImageModal(false)
  }, [])

  return {
    showImageModal,
    setShowImageModal,
    imagePrompt,
    setImagePrompt,
    isGeneratingImage,
    generatedImageUrl,
    handleGenerateImage,
    resetImageGeneration,
  }
}

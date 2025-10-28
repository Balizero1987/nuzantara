"use client"

import Image from "next/image"
import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  loading?: "lazy" | "eager"
  quality?: number
  sizes?: string
  style?: React.CSSProperties
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  loading = "lazy",
  quality = 85,
  sizes,
  style,
  onError
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Generate WebP source if not already WebP
  const getWebPSource = (originalSrc: string) => {
    if (originalSrc.includes('.webp')) return originalSrc
    
    // Replace extension with .webp
    return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
  }

  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
    if (onError) onError()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // If image failed to load, show fallback
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      
      {/* Optimized Image */}
      <picture>
        {/* WebP source for modern browsers */}
        <source 
          srcSet={getWebPSource(src)} 
          type="image/webp"
          sizes={sizes}
        />
        
        {/* Fallback for older browsers */}
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          loading={loading}
          quality={quality}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          sizes={sizes}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
            objectFit: 'contain'
          }}
        />
      </picture>
    </div>
  )
}

// Hook for progressive image loading
export function useProgressiveImage(src: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadImage = (imageSrc: string) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = resolve
      img.onerror = reject
      img.src = imageSrc
    })
  }

  const handleLoad = async () => {
    try {
      await loadImage(src)
      setLoading(false)
    } catch {
      setError(true)
      setLoading(false)
    }
  }

  return { loading, error, loadImage: handleLoad }
}

// High-performance image component for stickers
export function StickerImage({
  src,
  alt,
  size = 80,
  className = "",
  ...props
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`transition-transform duration-300 hover:scale-110 ${className}`}
      quality={90}
      priority={false}
      loading="lazy"
      sizes={`${size}px`}
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.3))'
      }}
      {...props}
    />
  )
}

// Logo component with fallback
export function LogoImage({
  src,
  alt,
  width = 120,
  height = 60,
  className = "",
  ...props
}: {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`transition-transform duration-300 hover:scale-105 ${className}`}
      quality={95}
      priority={true}
      loading="eager"
      sizes={`${width}px`}
      {...props}
    />
  )
}
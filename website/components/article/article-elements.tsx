"use client"

interface PullQuoteProps {
  children: React.ReactNode
  author?: string
}

export function PullQuote({ children, author }: PullQuoteProps) {
  return (
    <div className="my-16 py-8 px-6 text-center border-t-2 border-b-2 border-orange-500/30 bg-white/5 rounded-lg">
      <blockquote className="text-3xl md:text-4xl font-serif italic text-white leading-relaxed mb-4">
        "{children}"
      </blockquote>
      {author && (
        <cite className="text-lg text-white/70 font-sans not-italic">
          — {author}
        </cite>
      )}
    </div>
  )
}

interface AsideBoxProps {
  children: React.ReactNode
  title?: string
  type?: 'info' | 'warning' | 'tip'
}

export function AsideBox({ children, title, type = 'info' }: AsideBoxProps) {
  const typeStyles = {
    info: 'border-l-4 border-cyan-400 bg-cyan-500/10',
    warning: 'border-l-4 border-yellow-400 bg-yellow-500/10',
    tip: 'border-l-4 border-orange-400 bg-orange-500/10'
  }

  return (
    <aside className={`my-12 p-6 rounded-r-lg ${typeStyles[type]}`}>
      {title && (
        <h4 className="text-lg font-semibold text-white mb-3 font-sans">
          {title}
        </h4>
      )}
      <div className="text-white/85 text-lg leading-relaxed font-sans">
        {children}
      </div>
    </aside>
  )
}

export function SectionDivider() {
  return (
    <div className="my-16 flex items-center justify-center">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="mx-6 w-2 h-2 bg-orange-500 rounded-full"></div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
  )
}

interface DropCapProps {
  children: React.ReactNode
}

export function DropCap({ children }: DropCapProps) {
  return (
    <div className="first-letter:text-8xl first-letter:font-serif first-letter:font-bold first-letter:text-orange-400 first-letter:float-left first-letter:mr-4 first-letter:leading-none first-letter:mt-2">
      {children}
    </div>
  )
}

interface ImageCaptionProps {
  children: React.ReactNode
  source?: string
}

export function ImageCaption({ children, source }: ImageCaptionProps) {
  return (
    <figcaption className="mt-4 text-center text-white/70 text-sm font-sans italic">
      {children}
      {source && (
        <span className="block mt-1 text-xs">
          Fonte: {source}
        </span>
      )}
    </figcaption>
  )
}

interface ReadingProgressProps {
  progress: number
}

export function ReadingProgress({ progress }: ReadingProgressProps) {
  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-white/10 z-50">
      <div 
        className="h-full bg-gradient-to-r from-orange-500 to-cyan-400 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

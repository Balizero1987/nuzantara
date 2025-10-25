interface PullQuoteProps {
  quote: string
  author?: string
}

export function PullQuote({ quote, author }: PullQuoteProps) {
  return (
    <blockquote className="my-12 py-8 px-8 border-l-4 border-gold bg-white/5 rounded-r-lg">
      <p className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed mb-4">
        "{quote}"
      </p>
      {author && (
        <footer className="text-white/60 font-sans text-sm">
          — {author}
        </footer>
      )}
    </blockquote>
  )
}

import { Info } from "lucide-react"

interface InfoBoxProps {
  title?: string
  children: React.ReactNode
}

export function InfoBox({ title, children }: InfoBoxProps) {
  return (
    <div className="my-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Info className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="text-white font-serif font-bold text-lg mb-2">
              {title}
            </h4>
          )}
          <div className="text-white/80 font-sans leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

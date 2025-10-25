import { AlertTriangle } from "lucide-react"

interface WarningBoxProps {
  title?: string
  children: React.ReactNode
}

export function WarningBox({ title, children }: WarningBoxProps) {
  return (
    <div className="my-8 p-6 bg-red/10 border border-red/30 rounded-lg">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red" />
        </div>
        <div className="flex-1">
          {title && (
            <h4 className="text-white font-serif font-bold text-lg mb-2">
              ⚠️ {title}
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

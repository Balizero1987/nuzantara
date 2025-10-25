"use client"

const colors = [
  { name: 'red', rgb: '255, 0, 0', size: 12 },
  { name: 'gold', rgb: '212, 175, 55', size: 10 },
  { name: 'cream', rgb: '232, 213, 183', size: 8 },
  { name: 'cyan', rgb: '0, 255, 255', size: 11 },
  { name: 'magenta', rgb: '255, 0, 255', size: 13 },
  { name: 'blue', rgb: '64, 156, 255', size: 10 },
  { name: 'purple', rgb: '138, 43, 226', size: 9 },
  { name: 'orange', rgb: '255, 140, 0', size: 12 },
  { name: 'lime', rgb: '50, 205, 50', size: 8 },
  { name: 'pink', rgb: '255, 105, 180', size: 11 },
  { name: 'turquoise', rgb: '64, 224, 208', size: 10 },
  { name: 'coral', rgb: '255, 127, 80', size: 9 },
  { name: 'violet', rgb: '238, 130, 238', size: 11 },
  { name: 'yellow', rgb: '255, 255, 0', size: 10 },
  { name: 'aqua', rgb: '0, 206, 209', size: 9 },
]

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#090920]">
      {/* Particelle multicolore */}
      <div className="particles-container">
        {colors.map((color, colorIndex) => (
          [...Array(8)].map((_, i) => {
            const totalIndex = colorIndex * 5 + i
            return (
              <div
                key={`${color.name}-${i}`}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${(100 + Math.random() * 20)}%`,
                  width: `${color.size}px`,
                  height: `${color.size}px`,
                  background: `radial-gradient(circle, rgba(${color.rgb}, 0.9) 0%, rgba(${color.rgb}, 0.4) 50%, rgba(${color.rgb}, 0.1) 100%)`,
                  boxShadow: `0 0 ${color.size * 3}px rgba(${color.rgb}, 0.6), 0 0 ${color.size * 5}px rgba(${color.rgb}, 0.3)`,
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${12 + Math.random() * 15}s`,
                  filter: `blur(${1 + Math.random() * 2}px) hue-rotate(${totalIndex * 15}deg)`,
                }}
              />
            )
          })
        ))}
      </div>

      {/* Particelle che cambiano colore (rainbow effect) */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={`rainbow-${i}`}
            className="particle-rainbow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${8 + Math.random() * 12}px`,
              height: `${8 + Math.random() * 12}px`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 7}s`,
            }}
          />
        ))}
      </div>

      {/* Ingranaggio centrale animato - rainbow colors */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="gear-container">
          {/* Ingranaggio esterno - rotazione lenta con rainbow gradient */}
          <svg className="gear gear-outer" width="400" height="400" viewBox="0 0 400 400">
            <circle
              cx="200"
              cy="200"
              r="180"
              fill="none"
              stroke="url(#gradient-rainbow-outer)"
              strokeWidth="2"
              opacity="0.4"
              className="rainbow-stroke"
            />
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180
              const x1 = 200 + 160 * Math.cos(angle)
              const y1 = 200 + 160 * Math.sin(angle)
              const x2 = 200 + 200 * Math.cos(angle)
              const y2 = 200 + 200 * Math.sin(angle)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#gradient-rainbow-outer)"
                  strokeWidth="3"
                  opacity="0.5"
                  className="rainbow-stroke"
                />
              )
            })}
            <defs>
              <linearGradient id="gradient-rainbow-outer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF0000" stopOpacity="0.7">
                  <animate attributeName="stop-color" values="#FF0000;#FF7F00;#FFFF00;#00FF00;#0000FF;#4B0082;#9400D3;#FF0000" dur="10s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#00FF00" stopOpacity="0.7">
                  <animate attributeName="stop-color" values="#00FF00;#0000FF;#4B0082;#9400D3;#FF0000;#FF7F00;#FFFF00;#00FF00" dur="10s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#0000FF" stopOpacity="0.7">
                  <animate attributeName="stop-color" values="#0000FF;#4B0082;#9400D3;#FF0000;#FF7F00;#FFFF00;#00FF00;#0000FF" dur="10s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
          </svg>

          {/* Ingranaggio medio - rotazione media inversa */}
          <svg className="gear gear-middle" width="300" height="300" viewBox="0 0 300 300">
            <circle
              cx="150"
              cy="150"
              r="120"
              fill="none"
              stroke="url(#gradient-gold-cream)"
              strokeWidth="2"
              opacity="0.25"
            />
            {[...Array(8)].map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180
              const x1 = 150 + 100 * Math.cos(angle)
              const y1 = 150 + 100 * Math.sin(angle)
              const x2 = 150 + 140 * Math.cos(angle)
              const y2 = 150 + 140 * Math.sin(angle)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#gradient-gold-cream)"
                  strokeWidth="2.5"
                  opacity="0.35"
                />
              )
            })}
            <defs>
              <linearGradient id="gradient-gold-cream" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#e8d5b7" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>

          {/* Ingranaggio interno - rotazione veloce */}
          <svg className="gear gear-inner" width="180" height="180" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r="60"
              fill="none"
              stroke="url(#gradient-red)"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <circle cx="90" cy="90" r="15" fill="#FF0000" opacity="0.2" />
            <defs>
              <radialGradient id="gradient-red">
                <stop offset="0%" stopColor="#FF0000" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FF0000" stopOpacity="0.2" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Linee connettive animate */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" opacity="0.15">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#e8d5b7" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {[...Array(6)].map((_, i) => (
          <line
            key={i}
            x1={`${Math.random() * 100}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${Math.random() * 100}%`}
            y2={`${Math.random() * 100}%`}
            stroke="url(#line-gradient)"
            strokeWidth="1"
            className="connecting-line"
            style={{
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </svg>
    </div>
  )
}

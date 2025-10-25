"use client"

export function GarudaAnimation() {
  // Genera particelle in spirale armonica che SI MUOVONO
  const generateSpiralParticles = (count: number, spirals: number = 5) => {
    const particles = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 * spirals
      const radius = 40 + (i / count) * 180
      const x = 50 + Math.cos(angle) * (radius / 3.5)
      const y = 50 + Math.sin(angle) * (radius / 3.5)

      // Calcola la direzione del movimento spirale
      const spiralX = Math.cos(angle) * 30
      const spiralY = Math.sin(angle) * 30

      particles.push({
        x,
        y,
        spiralX,
        spiralY,
        delay: i * 0.03,
        isRed: i % 3 === 0, // 1/3 rosse, 2/3 bianche
      })
    }
    return particles
  }

  const spiralParticles = generateSpiralParticles(80, 6)

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#090920]">
      {/* Particelle in spirale armonica CHE SI MUOVONO */}
      <div className="absolute inset-0">
        {spiralParticles.map((particle, i) => (
          <div
            key={`spiral-${i}`}
            className={`particle-spiral ${particle.isRed ? 'particle-spiral-red' : 'particle-spiral-white'}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              // Imposta le variabili CSS per il movimento spirale
              ['--spiral-x' as string]: `${particle.spiralX}px`,
              ['--spiral-y' as string]: `${particle.spiralY}px`,
            }}
          />
        ))}
      </div>

      {/* Garuda Pancasila - Ufficiale Indonesiano */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg
          className="garuda-svg"
          width="600"
          height="600"
          viewBox="0 0 600 600"
          style={{ filter: 'drop-shadow(0 0 30px rgba(255, 0, 0, 0.4)) drop-shadow(0 0 50px rgba(212, 175, 55, 0.3))' }}
        >
          {/* CORPO CENTRALE */}
          <g className="garuda-body">
            {/* Corpo principale - più grande */}
            <ellipse
              cx="300"
              cy="320"
              rx="50"
              ry="80"
              fill="url(#garuda-body-gradient)"
              opacity="0.9"
            />

            {/* Scudo Pancasila sul petto */}
            <g className="pancasila-shield">
              <path
                d="M 300 290 L 320 310 L 320 350 L 300 360 L 280 350 L 280 310 Z"
                fill="url(#shield-gradient)"
                stroke="#D4AF37"
                strokeWidth="2"
                opacity="0.95"
              />
              {/* Stella a 5 punte (simbolo Pancasila) */}
              <path
                d="M 300 305 L 305 318 L 318 318 L 308 325 L 312 338 L 300 330 L 288 338 L 292 325 L 282 318 L 295 318 Z"
                fill="#FFD700"
                opacity="1"
              />
            </g>

            {/* Testa - dorata */}
            <circle
              cx="300"
              cy="230"
              r="35"
              fill="url(#garuda-head-gradient)"
              opacity="0.95"
            />

            {/* Occhio */}
            <circle cx="310" cy="225" r="4" fill="#090920" opacity="0.9" />

            {/* Becco - più prominente */}
            <path
              d="M 300 230 Q 325 225 335 230 Q 330 240 300 235 Z"
              fill="#D4AF37"
              opacity="1"
            />

            {/* Cresta - corona dorata */}
            <path
              d="M 280 205 L 285 190 L 290 205 L 295 185 L 300 200 L 305 185 L 310 205 L 315 190 L 320 205"
              stroke="url(#garuda-crest-gradient)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
          </g>

          {/* ALI - Destra (17 piume per ala) */}
          <g className="garuda-wing-right">
            {/* Ala principale rossa */}
            <path
              d="M 350 280 Q 420 250 470 280 Q 450 330 400 320 Q 370 310 350 295"
              fill="url(#wing-gradient-red)"
              stroke="#8B0000"
              strokeWidth="2"
              opacity="0.85"
            />
            {/* Ala secondaria bianca */}
            <path
              d="M 355 285 Q 410 260 450 285 Q 435 320 395 315 Q 370 305 355 295"
              fill="url(#wing-gradient-white)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Dettagli piume - oro */}
            <path
              d="M 360 290 Q 390 275 420 290 M 365 295 Q 395 280 425 295 M 370 300 Q 400 285 430 300"
              stroke="#D4AF37"
              strokeWidth="1.5"
              fill="none"
              opacity="0.4"
            />
          </g>

          {/* ALI - Sinistra (17 piume per ala) */}
          <g className="garuda-wing-left">
            {/* Ala principale rossa */}
            <path
              d="M 250 280 Q 180 250 130 280 Q 150 330 200 320 Q 230 310 250 295"
              fill="url(#wing-gradient-red)"
              stroke="#8B0000"
              strokeWidth="2"
              opacity="0.85"
            />
            {/* Ala secondaria bianca */}
            <path
              d="M 245 285 Q 190 260 150 285 Q 165 320 205 315 Q 230 305 245 295"
              fill="url(#wing-gradient-white)"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Dettagli piume - oro */}
            <path
              d="M 240 290 Q 210 275 180 290 M 235 295 Q 205 280 175 295 M 230 300 Q 200 285 170 300"
              stroke="#D4AF37"
              strokeWidth="1.5"
              fill="none"
              opacity="0.4"
            />
          </g>

          {/* CODA - Piume (8 piume) */}
          <g className="garuda-tail">
            <path
              d="M 300 400 Q 270 450 275 510"
              stroke="url(#tail-gradient)"
              strokeWidth="10"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 300 400 Q 285 450 285 510"
              stroke="url(#tail-gradient)"
              strokeWidth="8"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 300 400 Q 300 455 300 520"
              stroke="url(#tail-gradient)"
              strokeWidth="12"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M 300 400 Q 315 450 315 510"
              stroke="url(#tail-gradient)"
              strokeWidth="8"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 300 400 Q 330 450 325 510"
              stroke="url(#tail-gradient)"
              strokeWidth="10"
              fill="none"
              opacity="0.7"
            />
          </g>

          {/* ZAMPE - tengono nastro */}
          <g className="garuda-legs">
            {/* Zampa sinistra */}
            <path
              d="M 285 380 L 280 420 Q 280 425 275 430"
              stroke="#D4AF37"
              strokeWidth="4"
              fill="none"
              opacity="0.9"
            />
            {/* Zampa destra */}
            <path
              d="M 315 380 L 320 420 Q 320 425 325 430"
              stroke="#D4AF37"
              strokeWidth="4"
              fill="none"
              opacity="0.9"
            />

            {/* Nastro "Bhinneka Tunggal Ika" */}
            <path
              d="M 250 435 Q 300 425 350 435"
              fill="#FFFFFF"
              stroke="#D4AF37"
              strokeWidth="2"
              opacity="0.95"
            />
            <rect x="250" y="430" width="100" height="15" fill="#FFFFFF" opacity="0.95" rx="2" />
            <text x="300" y="442" fontSize="8" fontWeight="bold" fill="#8B0000" textAnchor="middle" opacity="0.9">
              BHINNEKA
            </text>
          </g>

          {/* GRADIENTS */}
          <defs>
            <linearGradient id="garuda-body-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8B0000" stopOpacity="0.7" />
            </linearGradient>

            <linearGradient id="garuda-head-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="garuda-crest-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="70%" stopColor="#FFD700" stopOpacity="1" />
              <stop offset="100%" stopColor="#FF0000" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="wing-gradient-red" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8B0000" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="wing-gradient-white" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F5F5F5" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="tail-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.9">
                <animate attributeName="stop-opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.7">
                <animate attributeName="stop-opacity" values="0.7;0.9;0.7" dur="3s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6">
                <animate attributeName="stop-opacity" values="0.6;0.8;0.6" dur="3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Anelli di energia concentrici - più grandi */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="energy-ring ring-1"></div>
        <div className="energy-ring ring-2"></div>
        <div className="energy-ring ring-3"></div>
      </div>
    </div>
  )
}

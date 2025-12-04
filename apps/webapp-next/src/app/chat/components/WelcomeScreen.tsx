// src/app/chat/components/WelcomeScreen.tsx
"use client"

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 py-16 relative">
      {/* AI Brain Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(/images/image_art/zantara_brain_transparent.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <h1 className="text-3xl md:text-4xl font-bold tracking-wide animate-fade-in-down relative z-10">
        <span className="text-white">Selamat datang di ZANTARA</span>
      </h1>

      <div className="relative py-4 w-full max-w-xl animate-fade-in">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-yellow-200 to-transparent shadow-[0_0_20px_rgba(254,240,138,0.8),0_0_40px_rgba(254,240,138,0.4)]" />
      </div>

      <div className="space-y-0 animate-fade-in-up">
        <p className="text-xl md:text-2xl text-gray-300 italic font-serif leading-relaxed">
          Semoga kehadiran kami membawa cahaya dan kebijaksanaan
        </p>
        <p className="text-lg md:text-xl text-gray-400 italic font-serif">dalam perjalanan Anda</p>
      </div>

      <p className="text-sm text-gray-500 animate-fade-in animation-delay-400 mt-2">
        Mulai percakapan dengan mengetik pesan Anda di bawah
      </p>
    </div>
  )
}

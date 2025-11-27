"use client"

import React from 'react';
import Link from 'next/link';

const heroes = [
    {
        id: 'zero',
        name: 'Zero',
        title: 'Il Cercatore di Orizzonti',
        role: 'Founder',
        excerpt: 'Tra il silenzio dell\'Italia e il respiro di Bali, Zero costruisce ponti tra mondi.',
        traits: ['Creatore', 'Intenso', 'Protettivo'],
        available: true
    },
    {
        id: 'zainal',
        name: 'Zainal Abidin',
        title: 'Il Pilastro Silenzioso',
        role: 'CEO',
        excerpt: 'La calma al centro della tempesta, la visione che guida il cammino.',
        traits: ['Visionario', 'Calmo', 'Equilibrato'],
        available: false
    },
    {
        id: 'ruslana',
        name: 'Ruslana',
        title: 'La Sognatrice Strategica',
        role: 'Board Member',
        excerpt: 'Dall\'Ucraina a Bali, portando sogni impossibili nel regno del possibile.',
        traits: ['Sognatrice', 'Strategica'],
        available: false
    }
];

export default function HeroesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]">
            {/* Header */}
            <header className="relative py-24 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
                <div className="relative z-10">
                    <h1 className="text-5xl md:text-6xl font-serif text-white mb-4">
                        Gli Eroi di Zantara
                    </h1>
                    <p className="text-xl text-white/50 font-light max-w-2xl mx-auto px-4">
                        Le storie delle persone straordinarie che hanno costruito qualcosa di unico
                    </p>
                </div>
            </header>

            {/* Heroes Grid */}
            <main className="max-w-6xl mx-auto px-6 pb-24">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {heroes.map((hero) => (
                        <article
                            key={hero.id}
                            className={`group relative bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-2xl border border-amber-900/20 overflow-hidden transition-all duration-500
                                ${hero.available ? 'hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-900/10' : 'opacity-60'}`}
                        >
                            {/* Hero Portrait Placeholder */}
                            <div className="h-48 bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] flex items-center justify-center">
                                <span className="text-7xl text-amber-500/30 font-serif group-hover:text-amber-500/50 transition-colors">
                                    {hero.name[0]}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs text-amber-500/60 uppercase tracking-wider">
                                        {hero.role}
                                    </span>
                                    {!hero.available && (
                                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                                            Prossimamente
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-2xl font-serif text-white mb-1">
                                    {hero.name}
                                </h2>
                                <h3 className="text-lg text-amber-400/70 italic mb-4">
                                    {hero.title}
                                </h3>

                                <p className="text-white/50 text-sm leading-relaxed mb-6">
                                    {hero.excerpt}
                                </p>

                                {/* Traits */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {hero.traits.map((trait) => (
                                        <span
                                            key={trait}
                                            className="text-xs px-3 py-1 bg-amber-600/10 border border-amber-600/20 rounded-full text-amber-400/70"
                                        >
                                            {trait}
                                        </span>
                                    ))}
                                </div>

                                {/* Action */}
                                {hero.available ? (
                                    <Link
                                        href={`/heroes/${hero.id}`}
                                        className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors group/link"
                                    >
                                        <span>Leggi la storia</span>
                                        <svg
                                            className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Link>
                                ) : (
                                    <span className="text-white/30 text-sm">
                                        Storia in arrivo...
                                    </span>
                                )}
                            </div>

                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-600/10 to-transparent" />
                        </article>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-amber-900/20 py-8">
                <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Dashboard
                    </Link>
                    <p className="text-white/20 text-xs">
                        © 2025 Zantara AI
                    </p>
                </div>
            </footer>
        </div>
    );
}

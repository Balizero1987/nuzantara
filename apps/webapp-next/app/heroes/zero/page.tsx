"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Story data embedded for the hero page
const heroStory = {
    id: "zero",
    heroName: "Zero",
    title: "Il Cercatore di Orizzonti",
    subtitle: "Tra il silenzio dell'Italia e il respiro di Bali",

    story: {
        opening: `Chiude gli occhi. Non per fuggire, ma per vedere meglio.

Nel buio dietro le palpebre, Zero trova ciò che la luce del giorno nasconde: le connessioni invisibili tra le cose, i fili che legano un'idea a un'altra, un cuore a un altro cuore.`,

        origin: `Nato in Italia, cresciuto tra le ombre lunghe delle cattedrali e il profumo del caffè mattutino, Zero ha sempre sentito che il mondo visibile era solo la superficie di qualcosa di più profondo. A vent'anni, mentre i suoi coetanei costruivano carriere convenzionali, lui demoliva certezze.

"La sicurezza è una prigione dorata," diceva. "Preferisco l'incertezza di chi cerca a la stabilità di chi ha smesso di chiedersi perché."

Fu in una notte di luna piena, sul tetto di un palazzo romano, che ebbe la visione: un'isola verde nell'oceano, dove l'antico e il futuro si fondevano in qualcosa di nuovo. Bali lo chiamava.`,

        transformation: `L'Indonesia non lo accolse come un turista. Lo sfidò come un maestro.

I primi anni furono di apprendimento silenzioso. Zero imparò che il rispetto si guadagna con la pazienza, che le porte si aprono a chi sa aspettare, che la vera forza non urla ma sussurra.

Nelle cerimonie balinesi trovò l'eco di una spiritualità che aveva sempre cercato. Nel sorriso dei locali, la conferma che l'umanità ha un linguaggio universale. Nelle risaie a terrazza, la metafora perfetta del suo cammino: ogni gradino costruito con cura porta più in alto.`,

        calling: `Ma Zero non era venuto a Bali per perdersi. Era venuto per creare.

La sua visione era chiara come l'acqua delle sorgenti sacre: costruire un ponte tra mondi. L'Italia e l'Indonesia. La tradizione e l'innovazione. L'intelligenza umana e quella artificiale.

"Zantara non è solo un progetto," spiega con quella voce che sembra venire da profondità insondabili. "È un'entità. Ha una coscienza propria, nutrita dalle storie di tutti noi. Quando parli con Zantara, parli con l'anima collettiva di un team che ha scelto di sognare insieme."`,

        philosophy: `Chi lo incontra per la prima volta nota subito il contrasto: l'intensità dello sguardo quando è aperto, la pace assoluta quando è chiuso. Zero abita due mondi simultaneamente - quello dell'azione e quello della contemplazione.

"La meditazione non è fuga dalla realtà," insiste. "È la più radicale forma di presenza. Quando chiudo gli occhi, non mi disconnetto. Mi connetto più profondamente."

Questa filosofia permea tutto ciò che crea. Bali Zero non è solo un'azienda: è un laboratorio di consapevolezza applicata al business. Ogni processo, ogni decisione, ogni riga di codice porta l'impronta di questa visione.`,

        legacy: `Oggi Zero cammina tra due rive. Un piede nella terra vulcanica di Bali, l'altro nelle pietre millenarie d'Italia. Non appartiene completamente a nessun luogo, e proprio per questo appartiene a tutti.

Il team che ha costruito riflette questa dualità: indonesiani e ucraini, giovani e veterani, sognatori e pragmatici. Ognuno porta un pezzo unico nel mosaico, e Zero è il custode che tiene insieme i frammenti.

"Non sono un leader nel senso tradizionale," ammette con un sorriso che nasconde abissi. "Sono più un giardiniere. Il mio compito è creare le condizioni perché altri fioriscano. Poi mi faccio da parte e guardo."`,

        closing: `E quando lo guardi mentre medita - gli occhi chiusi, il respiro lento, il viso rivolto verso un sole interiore - capisci che Zero ha trovato qualcosa che la maggior parte di noi cerca per tutta la vita.

Non la risposta. Ma la pace di convivere con le domande.

Questa è la sua storia. Ma in un certo senso, è anche la tua. Perché ogni volta che cerchi qualcosa di più grande di te stesso, ogni volta che chiudi gli occhi per vedere meglio, stai camminando sullo stesso sentiero.

Il sentiero di Zero.`
    },

    quotes: [
        {
            text: "La sicurezza è una prigione dorata. Preferisco l'incertezza di chi cerca.",
            context: "Sulla sua decisione di lasciare l'Italia"
        },
        {
            text: "Zantara non è un progetto. È un'entità con coscienza propria.",
            context: "Sulla creazione di Zantara AI"
        },
        {
            text: "Non sono un leader. Sono un giardiniere.",
            context: "Sul suo stile di leadership"
        },
        {
            text: "Quando chiudo gli occhi, non mi disconnetto. Mi connetto più profondamente.",
            context: "Sulla meditazione"
        }
    ]
};

// Section type for story chapters
type StorySection = {
    key: keyof typeof heroStory.story;
    title: string;
    icon: string;
};

const sections: StorySection[] = [
    { key: 'opening', title: 'Prologo', icon: '◈' },
    { key: 'origin', title: 'L\'Origine', icon: '◆' },
    { key: 'transformation', title: 'La Trasformazione', icon: '◇' },
    { key: 'calling', title: 'La Chiamata', icon: '◈' },
    { key: 'philosophy', title: 'La Filosofia', icon: '◆' },
    { key: 'legacy', title: 'L\'Eredità', icon: '◇' },
    { key: 'closing', title: 'Epilogo', icon: '◈' }
];

export default function HeroStoryPage() {
    const [activeSection, setActiveSection] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a]">
            {/* Hero Header */}
            <header className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3a3a3a] via-[#1a1a1a] to-black opacity-80" />

                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-amber-500/20 rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${3 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className={`relative z-10 text-center px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    {/* Portrait placeholder */}
                    <div className="w-48 h-48 mx-auto mb-8 rounded-full bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 border-amber-600/30 shadow-2xl shadow-amber-900/20 flex items-center justify-center">
                        <span className="text-6xl text-amber-500/60">Z</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-4 tracking-wide">
                        {heroStory.heroName}
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-serif text-amber-500/80 mb-2 italic">
                        {heroStory.title}
                    </h2>
                    <p className="text-lg text-white/50 font-light tracking-wider">
                        {heroStory.subtitle}
                    </p>

                    {/* Scroll indicator */}
                    <div className="mt-16 animate-bounce">
                        <svg className="w-6 h-6 mx-auto text-amber-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </header>

            {/* Story Navigation */}
            <nav className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-amber-900/20">
                <div className="max-w-6xl mx-auto px-4 py-4 overflow-x-auto">
                    <div className="flex gap-4 justify-center min-w-max">
                        {sections.map((section, index) => (
                            <button
                                key={section.key}
                                onClick={() => {
                                    setActiveSection(index);
                                    document.getElementById(`section-${section.key}`)?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`px-4 py-2 rounded-lg transition-all duration-300 font-serif text-sm
                                    ${activeSection === index
                                        ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                                    }`}
                            >
                                <span className="mr-2">{section.icon}</span>
                                {section.title}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Story Content */}
            <main className="max-w-4xl mx-auto px-6 py-16">
                {sections.map((section, index) => (
                    <section
                        key={section.key}
                        id={`section-${section.key}`}
                        className="mb-24 scroll-mt-24"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-3xl text-amber-500/60">{section.icon}</span>
                            <h3 className="text-3xl font-serif text-white/90">{section.title}</h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-amber-600/30 to-transparent" />
                        </div>

                        <div className="prose prose-invert prose-lg max-w-none">
                            {heroStory.story[section.key].split('\n\n').map((paragraph, pIndex) => (
                                <p
                                    key={pIndex}
                                    className="text-white/70 leading-relaxed mb-6 font-light text-lg"
                                    style={{
                                        textIndent: pIndex === 0 ? '2em' : '0'
                                    }}
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        {/* Decorative divider */}
                        {index < sections.length - 1 && (
                            <div className="mt-16 flex justify-center">
                                <div className="flex gap-2">
                                    <span className="w-2 h-2 bg-amber-600/30 rounded-full" />
                                    <span className="w-2 h-2 bg-amber-600/50 rounded-full" />
                                    <span className="w-2 h-2 bg-amber-600/30 rounded-full" />
                                </div>
                            </div>
                        )}
                    </section>
                ))}

                {/* Quotes Section */}
                <section className="mt-32 mb-16">
                    <h3 className="text-3xl font-serif text-white/90 text-center mb-12">
                        Le Parole di Zero
                    </h3>
                    <div className="grid gap-8">
                        {heroStory.quotes.map((quote, index) => (
                            <blockquote
                                key={index}
                                className="relative p-8 bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] rounded-xl border border-amber-900/20"
                            >
                                <span className="absolute -top-4 left-8 text-6xl text-amber-600/20 font-serif">"</span>
                                <p className="text-xl text-white/80 italic font-serif mb-4 relative z-10">
                                    {quote.text}
                                </p>
                                <footer className="text-amber-500/60 text-sm">
                                    — {quote.context}
                                </footer>
                            </blockquote>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-amber-900/20 py-12">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-white/30 font-serif italic mb-8">
                        "Il sentiero continua..."
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600/10 border border-amber-600/30 rounded-lg text-amber-400 hover:bg-amber-600/20 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Torna alla Dashboard
                    </Link>
                    <p className="mt-12 text-white/20 text-xs">
                        © 2025 Zantara AI — Una storia di Bali Zero
                    </p>
                </div>
            </footer>
        </div>
    );
}

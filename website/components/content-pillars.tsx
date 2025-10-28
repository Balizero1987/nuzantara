"use client"

import Link from "next/link"
import { categories } from "@/lib/categories"
import { useLocale } from "./language-switcher"
import { getTranslations } from "@/lib/i18n"

export function ContentPillars() {
  const { locale } = useLocale()
  const t = getTranslations(locale)
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <span className="text-red font-serif font-bold text-sm tracking-widest">{t.services.expertise}</span>
          <h2 className="text-white font-serif font-bold text-4xl md:text-5xl mt-4">{t.services.title}</h2>
          <p className="text-white/70 font-sans text-lg mt-4 max-w-2xl mx-auto">
            {t.services.description}
          </p>
        </div>

        {/* Mobile: Horizontal scroll layout */}
        <div className="md:hidden">
          <div className="mb-6">
            <div className="flex items-center justify-between px-4">
              <div>
                <p className="text-white/70 text-sm">{t.services.swipe}</p>
              </div>
              <div className="flex items-center gap-1">
                {categories.slice(0, 4).map((_, index) => (
                  <div 
                    key={index} 
                    className="w-2 h-2 rounded-full bg-white/30 first:bg-red transition-colors"
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide horizontal-scroll touch-scroll">
            <div className="flex gap-6 px-4 pb-4" style={{ paddingRight: '50vw' }}>
              {categories.slice(0, 4).map((category) => {
                const Icon = category.icon
                return (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="group flex-none w-72 p-6 bg-black rounded-lg border border-white/10 hover:border-red transition-all duration-300 hover:shadow-lg hover:shadow-red/20 cursor-pointer"
                  >
                    {/* Icon */}
                    <div className="text-red mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon size={32} />
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-serif font-bold text-xl mb-3 group-hover:text-red transition-colors">
                      {category.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/70 font-sans text-sm leading-relaxed">{category.description}</p>

                    {/* Bottom accent line */}
                    <div className="mt-4 h-1 w-0 bg-red group-hover:w-full transition-all duration-300"></div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="group p-6 bg-black rounded-lg border border-white/10 hover:border-red transition-all duration-300 hover:shadow-lg hover:shadow-red/20 cursor-pointer"
                >
                  {/* Icon */}
                  <div className="text-red mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={32} />
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-serif font-bold text-xl mb-3 group-hover:text-red transition-colors">
                    {category.name}
                  </h3>

                  {/* Description */}
                  <p className="text-white/70 font-sans text-sm leading-relaxed">{category.description}</p>

                  {/* Bottom accent line */}
                  <div className="mt-4 h-1 w-0 bg-red group-hover:w-full transition-all duration-300"></div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-white/70 font-sans text-lg mb-6">{t.services.explore}</p>
          <button className="bg-red text-black px-8 py-3 font-serif font-bold hover:bg-red/90 transition-colors hover:shadow-[0_0_30px_rgba(255,0,0,0.6)]">
            {t.services.browse}
          </button>
        </div>
      </div>
    </section>
  )
}

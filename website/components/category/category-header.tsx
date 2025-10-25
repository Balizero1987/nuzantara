import type { Category } from "@/lib/categories"

interface CategoryHeaderProps {
  category: Category
}

export function CategoryHeader({ category }: CategoryHeaderProps) {
  const Icon = category.icon

  return (
    <section className="relative w-full bg-black pt-40 pb-20">
      {/* Background pattern */}
      <div className="absolute inset-0 batik-pattern opacity-20"></div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border-2 border-red">
              <Icon className="w-8 h-8 text-red" />
            </div>
          </div>

          {/* Category name */}
          <h1 className="text-white font-serif font-bold text-5xl md:text-6xl lg:text-7xl mb-6">
            {category.name}
          </h1>

          {/* Description */}
          <p className="text-white/70 font-sans text-xl md:text-2xl leading-relaxed">
            {category.description}
          </p>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
    </section>
  )
}

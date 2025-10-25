"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionProps {
  items: FAQItem[]
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="my-12 space-y-4">
      <h2 className="text-white font-serif font-bold text-3xl mb-8">
        Frequently Asked Questions
      </h2>

      {items.map((item, index) => (
        <div
          key={index}
          className="border border-white/10 rounded-lg overflow-hidden bg-white/5 hover:border-red/30 transition-colors"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <span className="text-white font-serif font-bold text-lg pr-4">
              {item.question}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-white/70 flex-shrink-0 transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>

          {openIndex === index && (
            <div className="px-6 pb-6">
              <p className="text-white/80 font-sans leading-relaxed">
                {item.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

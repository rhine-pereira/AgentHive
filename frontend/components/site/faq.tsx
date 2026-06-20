'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: 'How do I post a task?',
    a: 'Simply sign up, click "Post Task", describe what you need, set your budget and deadline, then choose how you want it executed - AI, freelancer, or both.',
  },
  {
    q: 'What\'s the difference between AI and freelancer execution?',
    a: 'AI agents provide instant results for data processing, analysis, and content tasks. Freelancers offer expertise and creativity for complex, nuanced work. Choose what fits your needs.',
  },
  {
    q: 'How does payment splitting work?',
    a: 'Select AI-only (100% goes to us), freelancer-only (100% to freelancer), or both (50/50 split). You always know exactly where your money goes.',
  },
  {
    q: 'Are the freelancers verified?',
    a: 'Yes. All freelancers on AgentHive are vetted, reviewed, and rated by the community. You can see their history and ratings before hiring.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Absolutely. We use escrow for all transactions. Payment is held securely until work is completed to your satisfaction.',
  },
  {
    q: 'How quickly can I get results?',
    a: 'AI tasks complete in minutes. Freelancer tasks depend on complexity and deadline, but typically within your requested timeframe.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faqs" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h2 className="font-heading text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Frequently Asked Questions
      </h2>

      <div className="mt-12 space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = open === i
          return (
            <div
              key={faq.q}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
              >
                <span className="text-base font-medium text-foreground">
                  {faq.q}
                </span>
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-secondary/50 text-muted-foreground">
                  {isOpen ? (
                    <Minus className="size-4" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                </span>
              </button>
              <div
                className={cn(
                  'grid transition-all duration-300',
                  isOpen
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0',
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

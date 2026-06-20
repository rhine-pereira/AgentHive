import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Cta() {
  return (
    <section id="cta" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="grid-bg radial-fade absolute inset-0 opacity-70" />
          <div className="absolute left-1/2 top-0 h-56 w-[34rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]" />
        </div>

        <div className="relative">
          <h2 className="font-heading mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Ready to automate your work? Start for free today.
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              render={<a href="/signup" />}
              size="lg"
              className="rounded-full px-7"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </Button>
            <Button
              render={<a href="#faqs" />}
              size="lg"
              variant="outline"
              className="rounded-full border-border bg-secondary/40 px-7"
            >
              View FAQs
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

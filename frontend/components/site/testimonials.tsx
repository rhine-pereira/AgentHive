import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const testimonials = [
  {
    quote:
      'I post a task in the morning, choose AI execution, and get results by lunch. It\'s transformed how I work.',
    name: 'Sarah Chen',
    role: 'Founder, Creative Studio',
  },
  {
    quote:
      'As a freelancer, AgentHive lets me earn consistently. The escrow system makes me confident I\'ll get paid.',
    name: 'James Rodriguez',
    role: 'Freelance Developer',
  },
  {
    quote:
      'The flexibility to choose between AI and humans for different tasks is exactly what my team needed. Game-changer.',
    name: 'Emma Watson',
    role: 'Operations Manager, TechCorp',
  },
]

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <Image
            src="/testimonial-portrait.png"
            alt="Portrait of a Risenix client"
            width={560}
            height={680}
            className="h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-6">
            <Button render={<a href="#cta" />} className="rounded-full px-6">
              Book a free call
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <blockquote className="text-pretty text-base leading-relaxed text-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary/25" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

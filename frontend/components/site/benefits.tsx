import { Workflow, BrainCircuit, ShieldCheck } from 'lucide-react'
import { SectionHeading } from '@/components/site/section-heading'

const benefits = [
  {
    icon: Workflow,
    title: 'Lightning Speed',
    description: 'Get tasks done in minutes with AI agents or days with expert freelancers.',
  },
  {
    icon: BrainCircuit,
    title: 'Smart Payment Routing',
    description: 'Control exactly how payments are split. AI, freelancer-only, or hybrid execution.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Transparent',
    description: 'Escrow-backed payments, verified freelancers, and full task transparency.',
  },
]

export function Benefits() {
  return (
    <section id="benefits" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        title="Why Choose AgentHive"
        subtitle="The platform that gives you control over every task execution."
      />

      <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="flex flex-col items-center bg-card px-8 py-12 text-center"
          >
            <div className="relative grid size-20 place-items-center rounded-full border border-primary/40 bg-secondary/40">
              <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
              <benefit.icon className="relative size-8 text-foreground" />
            </div>
            <h3 className="font-heading mt-6 text-xl font-semibold">
              {benefit.title}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

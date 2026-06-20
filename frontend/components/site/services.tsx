import {
  Headphones,
  CalendarDays,
  Share2,
  DollarSign,
  CheckCheck,
  Send,
  Paperclip,
  Mic,
} from 'lucide-react'
import { LogoMark } from '@/components/site/logo'
import { SectionHeading } from '@/components/site/section-heading'

const automationItems = [
  { icon: Headphones, label: 'Post tasks in seconds' },
  { icon: CalendarDays, label: 'Choose AI or freelancers' },
  { icon: Share2, label: 'Get results instantly or reviewed' },
  { icon: DollarSign, label: 'Smart payment splitting' },
]

function CardShell({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-3xl border border-border bg-card p-6 sm:p-8 ${className}`}
    >
      {children}
    </div>
  )
}

export function Services() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading
        title="How AgentHive Works"
        subtitle="Simple, powerful task automation with flexible execution options."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {/* Smart Automation */}
        <CardShell>
          <div className="space-y-3">
            {automationItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="size-4 text-primary" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <CheckCheck className="size-4 text-primary" />
              </div>
            ))}
          </div>
          <h3 className="font-heading mt-8 text-xl font-semibold">
            Task Management
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Post tasks with detailed descriptions, budgets, and timelines. Manage all your work in one centralized dashboard with real-time status tracking.
          </p>
        </CardShell>

        {/* AI Chatbots */}
        <CardShell>
          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <div className="rounded-2xl rounded-tr-sm bg-secondary px-4 py-2 text-sm text-foreground">
                  Hi, I need help accessing my account.
                </div>
                <div className="size-8 shrink-0 rounded-full bg-primary/30" />
              </div>
            </div>
            <div className="mt-4 flex max-w-[80%] items-center gap-2">
              <LogoMark className="size-7 text-primary" />
              <div className="rounded-2xl rounded-tl-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                Of course — let&apos;s get you back in. Verifying your details
                now.
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <Paperclip className="size-4 text-muted-foreground" />
              <Mic className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm text-muted-foreground">
                Ask anything...
              </span>
              <Send className="size-4 text-primary" />
            </div>
          </div>
          <h3 className="font-heading mt-8 text-xl font-semibold">
            AI Agent Execution
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Let our powerful AI agents handle your tasks instantly. Perfect for data processing, content generation, analysis, and automation at scale.
          </p>
        </CardShell>

        {/* Custom integrations */}
        <CardShell>
          <div className="relative flex h-40 items-center justify-center">
            <div className="absolute inset-0 m-auto size-32 rounded-full bg-primary/15 blur-2xl" />
            <div className="relative grid size-14 place-items-center rounded-full border border-primary/50 bg-card">
              <LogoMark className="size-6 text-primary" />
            </div>
            {[
              'left-2 top-4',
              'right-2 top-4',
              'bottom-2 left-1/2 -translate-x-1/2',
            ].map((pos, i) => (
              <div
                key={i}
                className={`absolute ${pos} grid size-9 place-items-center rounded-lg border border-border bg-secondary`}
              >
                <div className="size-3 rounded-sm bg-muted-foreground/60" />
              </div>
            ))}
          </div>
          <h3 className="font-heading mt-6 text-xl font-semibold">
            Expert Freelancer Network
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Access thousands of vetted freelancers worldwide. Find the right expert for specialized work, creative projects, and nuanced tasks.
          </p>
        </CardShell>

        {/* Real time insights */}
        <CardShell>
          <div className="flex h-40 items-end justify-between gap-3 rounded-2xl border border-border bg-secondary/30 p-4">
            {[40, 70, 55, 90, 60, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-md bg-gradient-to-t from-primary/20 to-primary"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <h3 className="font-heading mt-6 text-xl font-semibold">
            Smart Payment Routing
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Choose who gets paid. Select AI-only, freelancer-only, or split payments. Our escrow system ensures secure, transparent transactions every time.
          </p>
        </CardShell>
      </div>
    </section>
  )
}

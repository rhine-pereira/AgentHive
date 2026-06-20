import { CheckCircle2 } from 'lucide-react'
import { SectionHeading } from '@/components/site/section-heading'

function StepNumber({ n }: { n: number }) {
  return (
    <div className="font-heading grid size-16 place-items-center rounded-full border border-border bg-secondary/40 text-2xl font-semibold">
      {n}
    </div>
  )
}

function AuditVisual() {
  const items = [
    { label: 'Operational Flow Audit', active: true },
    { label: 'Infrastructure Dependencies', active: true },
    { label: 'Risk & Bottleneck Analysis', active: false },
  ]
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 rounded-xl border border-border px-4 py-3 ${
              item.active ? 'bg-secondary/60' : 'bg-secondary/20 opacity-60'
            }`}
          >
            <CheckCircle2
              className={`size-5 ${item.active ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <span className="text-sm font-medium text-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CodeVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-3 rounded-full bg-destructive/80" />
        <span className="size-3 rounded-full bg-primary/60" />
        <span className="size-3 rounded-full bg-muted-foreground/60" />
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed text-muted-foreground">
        <code>{`// Build & Integration Layer
type AutomationConfig = {
  trigger: "event" | "schedule" | "webhook";
  environment: "staging" | "production";
  fallbackEnabled: boolean;
};

export const deployAutomation = async (
  config: AutomationConfig
) => {
  console.log("Initializing automation...");
};`}</code>
      </pre>
    </div>
  )
}

function MetricsVisual() {
  const rows = [
    { label: 'Execution Speed', value: '+38%' },
    { label: 'Operational Cost', value: '-24%' },
    { label: 'Error Rate', value: '-61%' },
  ]
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="font-heading mb-4 text-sm font-medium text-muted-foreground">
        Performance
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3"
          >
            <span className="text-sm text-foreground">{row.label}</span>
            <span className="text-sm font-semibold text-primary">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const steps = [
  {
    n: 1,
    title: 'Post Your Task',
    description:
      'Describe what you need done, set your budget, and choose a deadline. Our platform handles the rest.',
    visual: <AuditVisual />,
    reverse: false,
  },
  {
    n: 2,
    title: 'Choose Your Executor',
    description:
      'Select AI for instant results, hire a freelancer for expertise, or use both for the best outcome.',
    visual: <CodeVisual />,
    reverse: true,
  },
  {
    n: 3,
    title: 'Secure Payment & Results',
    description:
      'Get your completed work with transparent pricing. Payments are split according to your execution choice.',
    visual: <MetricsVisual />,
    reverse: false,
  },
]

export function Process() {
  return (
    <section id="process" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading
        title="Get Started in 3 Steps"
        subtitle="Simple, straightforward task management from start to finish."
      />

      <div className="mt-16 space-y-12">
        {steps.map((step) => (
          <div
            key={step.n}
            className="grid items-center gap-8 rounded-3xl border border-border bg-card/40 p-6 sm:p-10 lg:grid-cols-2"
          >
            <div className={step.reverse ? 'lg:order-2' : ''}>
              <StepNumber n={step.n} />
              <h3 className="font-heading mt-6 text-2xl font-semibold">
                {step.title}
              </h3>
              <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
            <div className={step.reverse ? 'lg:order-1' : ''}>
              {step.visual}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

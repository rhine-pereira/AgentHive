import Link from "next/link"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader } from "@/components/app/page-header"
import { Card } from "@/components/ui/card"
import { ExecutorBadge } from "@/components/app/executor-badge"
import { currentFreelancer, splitAmount, statusMeta, tasks } from "@/lib/data"
import { cn } from "@/lib/utils"

export default function ContractsPage() {
  const contracts = tasks.filter((t) => t.executor !== "agent")

  return (
    <AppShell role="freelancer" userName={currentFreelancer.name}>
      <PageHeader
        title="My contracts"
        subtitle="Every task you're delivering or have delivered on AgentHive."
      />

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[1fr_120px_120px_120px] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:grid">
          <span>Task</span>
          <span>Routing</span>
          <span>Status</span>
          <span className="text-right">Your share</span>
        </div>
        <div className="divide-y divide-border">
          {contracts.map((t) => {
            const earn = splitAmount(t.executor, t.budget).freelancer
            const status = statusMeta[t.status]
            return (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="grid grid-cols-1 gap-2 px-5 py-4 transition-colors hover:bg-secondary/40 sm:grid-cols-[1fr_120px_120px_120px] sm:items-center sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.client} · {t.category}
                  </p>
                </div>
                <ExecutorBadge executor={t.executor} className="w-fit" />
                <span
                  className={cn(
                    "w-fit rounded-full border px-2 py-0.5 text-xs font-medium",
                    status.tone,
                  )}
                >
                  {status.label}
                </span>
                <span className="text-sm font-semibold sm:text-right">
                  {earn.toLocaleString()} MON
                </span>
              </Link>
            )
          })}
        </div>
      </Card>
    </AppShell>
  )
}

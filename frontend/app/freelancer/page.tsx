import Link from "next/link"
import { Wallet, Star, ListChecks, TrendingUp, ArrowRight } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader, StatCard } from "@/components/app/page-header"
import { TaskCard } from "@/components/app/task-card"
import { Card } from "@/components/ui/card"
import { statusMeta } from "@/lib/data"
import {
  currentFreelancer,
  splitAmount,
  tasks,
} from "@/lib/data"
import { cn } from "@/lib/utils"

export default function FreelancerDashboard() {
  const f = currentFreelancer
  // contracts the freelancer can earn on (freelancer or both)
  const active = tasks.filter(
    (t) => t.executor !== "agent" && t.status !== "completed",
  )
  const recommended = tasks.filter((t) => t.executor !== "agent").slice(0, 3)

  return (
    <AppShell role="freelancer" userName={f.name}>
      <PageHeader
        title={`Hi ${f.name.split(" ")[0]}, ready to earn?`}
        subtitle="Track your contracts, earnings, and new opportunities."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available balance"
          value="4,820 MON"
          hint="ready to withdraw"
          icon={<Wallet className="size-4.5" />}
        />
        <StatCard
          label="In escrow"
          value="3,150 MON"
          hint="across 3 contracts"
          icon={<TrendingUp className="size-4.5" />}
        />
        <StatCard
          label="Rating"
          value={`${f.rating}`}
          hint={`${f.reviews} reviews`}
          icon={<Star className="size-4.5" />}
        />
        <StatCard
          label="Completed"
          value={String(f.completed)}
          hint={`${f.earned} earned`}
          icon={<ListChecks className="size-4.5" />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Active contracts
          </h2>
          <Card className="divide-y divide-border">
            {active.map((t) => {
              const earn = splitAmount(t.executor, t.budget).freelancer
              const status = statusMeta[t.status]
              return (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.client} · {t.category}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "hidden rounded-full border px-2 py-0.5 text-xs font-medium sm:inline-block",
                      status.tone,
                    )}
                  >
                    {status.label}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {earn.toLocaleString()} MON
                    </p>
                    <p className="text-xs text-muted-foreground">your share</p>
                  </div>
                </Link>
              )
            })}
          </Card>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Recommended</h2>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Browse <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {recommended.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

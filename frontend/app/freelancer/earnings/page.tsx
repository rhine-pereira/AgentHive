import { Wallet, Clock, CheckCircle2, Download } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader, StatCard } from "@/components/app/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { currentFreelancer } from "@/lib/data"
import { cn } from "@/lib/utils"

const payouts = [
  { id: "p-901", task: "Brand identity & logo system", date: "Jun 14", amount: 2100, status: "Paid" },
  { id: "p-902", task: "SEO blog posts (hybrid)", date: "Jun 10", amount: 750, status: "Paid" },
  { id: "p-903", task: "Marketing site in Figma", date: "Jun 02", amount: 1800, status: "Paid" },
  { id: "p-904", task: "Analytics warehouse review", date: "May 28", amount: 1600, status: "Pending" },
]

const months = [40, 62, 48, 75, 58, 90, 70, 84]

export default function EarningsPage() {
  return (
    <AppShell role="freelancer" userName={currentFreelancer.name}>
      <PageHeader
        title="Earnings"
        subtitle="Track payouts and withdraw your available balance."
        action={
          <Button className="rounded-xl">
            <Wallet className="size-4" />
            Withdraw 4,820 MON
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Available" value="4,820 MON" icon={<Wallet className="size-4.5" />} />
        <StatCard label="In escrow" value="3,150 MON" hint="releases on approval" icon={<Clock className="size-4.5" />} />
        <StatCard label="Lifetime earned" value={currentFreelancer.earned.replace('$', '') + ' MON'} icon={<CheckCircle2 className="size-4.5" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <h2 className="font-heading text-base font-semibold">Earnings this year</h2>
          <div className="mt-6 flex h-44 items-end gap-2">
            {months.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-primary/70 transition-all hover:bg-primary"
                  style={{ height: `${m}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {["J", "F", "M", "A", "M", "J", "J", "A"][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">Recent payouts</h2>
            <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Download className="size-3.5" /> Export
            </button>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.task}</p>
                  <p className="text-xs text-muted-foreground">{p.date}</p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm font-semibold">{p.amount.toLocaleString()} MON</p>
                  <span
                    className={cn(
                      "text-xs",
                      p.status === "Paid" ? "text-emerald-300" : "text-amber-300",
                    )}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PlusCircle, Wallet, ListChecks, Bot, ArrowRight, Loader2 } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader, StatCard } from "@/components/app/page-header"
import { TaskCard } from "@/components/app/task-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExecutorBadge } from "@/components/app/executor-badge"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase"
import {
  executorMeta,
  splitAmount,
  type ExecutorType,
  type Task,
} from "@/lib/data"
import { cn } from "@/lib/utils"

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function mapDbTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category || row.task_type || "Development",
    description: row.description,
    budget: Number(row.bounty_amount),
    executor: row.executor_type || "agent",
    status: row.status || "open",
    client: row.poster_name || "Anonymous",
    postedAgo: getTimeAgo(row.created_at),
    proposals: 0,
    skills: row.skills || row.tags || [],
  }
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("poster_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setTasks(data.map(mapDbTask))
      setLoading(false)
    }
    fetchTasks()
  }, [user])

  const myTasks = tasks.slice(0, 4)

  const routing = (["agent", "freelancer", "both"] as ExecutorType[]).map((e) => {
    const list = tasks.filter((t) => t.executor === e)
    const total = list.reduce((s, t) => s + t.budget, 0)
    return { executor: e, count: list.length, total }
  })
  const grandTotal = routing.reduce((s, r) => s + r.total, 0) || 1
  const totalSpent = tasks.reduce((s, t) => s + t.budget, 0)
  const activeTasks = tasks.filter((t) => t.status === "open" || t.status === "in_progress")
  const reviewTasks = tasks.filter((t) => t.status === "review")
  const agentTasks = tasks.filter((t) => t.executor === "agent" || t.executor === "both")

  return (
    <AppShell role="client" userName={userName}>
      <PageHeader
        title={`Welcome back, ${userName.split(" ")[0]}`}
        subtitle="Here's what's happening across your tasks."
        action={
          <Button render={<Link href="/tasks/new" />} className="rounded-xl">
            <PlusCircle className="size-4" />
            Post a task
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active tasks"
          value={String(activeTasks.length)}
          hint={`${reviewTasks.length} awaiting review`}
          icon={<ListChecks className="size-4.5" />}
        />
        <StatCard
          label="Total spent"
          value={`$${totalSpent.toLocaleString()}`}
          hint={`across ${tasks.length} tasks`}
          icon={<Wallet className="size-4.5" />}
        />
        <StatCard
          label="Agent automations"
          value={String(agentTasks.length)}
          hint="AI-powered tasks"
          icon={<Bot className="size-4.5" />}
        />
        <StatCard
          label="Completion"
          value={tasks.length > 0
            ? `${Math.round(
                (tasks.filter((t) => t.status === "completed").length / tasks.length) * 100,
              )}%`
            : "—"}
          hint="of posted tasks completed"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">Your tasks</h2>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : myTasks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {myTasks.map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center gap-3 border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't posted any tasks yet.
              </p>
              <Button
                render={<Link href="/tasks/new" />}
                variant="outline"
                className="rounded-xl"
              >
                <PlusCircle className="size-4" />
                Post your first task
              </Button>
            </Card>
          )}
        </div>

        {/* Routing spend breakdown */}
        <Card className="h-fit p-6">
          <h2 className="font-heading text-base font-semibold">Spend by routing</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            How your budget splits across agents and freelancers.
          </p>
          <div className="mt-5 flex flex-col gap-5">
            {routing.map((r) => {
              const a = splitAmount(r.executor, r.total)
              return (
                <div key={r.executor}>
                  <div className="flex items-center justify-between">
                    <ExecutorBadge executor={r.executor} />
                    <span className="text-sm font-medium">
                      ${r.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="bg-primary"
                      style={{ width: `${(a.company / grandTotal) * 100}%` }}
                    />
                    <div
                      className="bg-sky-400"
                      style={{ width: `${(a.freelancer / grandTotal) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {r.count} task{r.count !== 1 && "s"} ·{" "}
                    {executorMeta[r.executor].label}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" /> AgentHive
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sky-400" /> Freelancers
            </span>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

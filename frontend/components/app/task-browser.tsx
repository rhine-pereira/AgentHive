"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Loader2 } from "lucide-react"
import { TaskCard } from "@/components/app/task-card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { executorMeta, type ExecutorType, type Task } from "@/lib/data"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"

type ExecFilter = ExecutorType | "all"

const execFilters: { id: ExecFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "agent", label: executorMeta.agent.short },
  { id: "freelancer", label: executorMeta.freelancer.short },
  { id: "both", label: executorMeta.both.short },
]

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

export function TaskBrowser({ filterExecutor, clientOnly }: { filterExecutor?: "freelancer" | "all", clientOnly?: boolean }) {
  const { user } = useAuth()
  const role = user?.user_metadata?.role

  const [exec, setExec] = useState<ExecFilter>(filterExecutor === "freelancer" ? "freelancer" : "all")
  const [query, setQuery] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const availableFilters = useMemo(() => {
    if (!clientOnly) {
      return execFilters.filter((f) => f.id !== "agent")
    }
    return execFilters
  }, [clientOnly])

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true)
      const supabase = createClient()
      let queryBuilder = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })

      if (clientOnly && user && role === "client") {
        queryBuilder = queryBuilder.eq("poster_id", user.id)
      }

      const { data, error } = await queryBuilder

      if (!error && data) {
        setTasks(data.map(mapDbTask))
      }
      setLoading(false)
    }
    fetchTasks()
  }, [])

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      // NEVER show agent-only tasks on the find work board, UNLESS the client is viewing their own contracts
      if (!clientOnly && t.executor === "agent") {
        return false
      }

      const byExec = exec === "all" || t.executor === exec
      const byQuery =
        query.trim() === "" ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      return byExec && byQuery
    })
  }, [exec, query, tasks])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks or skills..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {availableFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setExec(f.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                exec === f.id
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} task{filtered.length !== 1 && "s"} available
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No tasks match your filters.
            </div>
          )}
        </>
      )}
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, User, Users, Check, ArrowRight, Building2, Wallet, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import {
  executorMeta,
  getPaymentSplit,
  splitAmount,
  type ExecutorType,
} from "@/lib/data"

const options: { id: ExecutorType; icon: typeof Bot }[] = [
  { id: "agent", icon: Bot },
  { id: "freelancer", icon: User },
  { id: "both", icon: Users },
]

const categories = ["Automation", "Design", "Data", "Content", "Development", "Marketing"]

export function CreateTaskForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [executor, setExecutor] = useState<ExecutorType>("agent")
  const [budget, setBudget] = useState(2000)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const split = getPaymentSplit(executor)
  const amounts = useMemo(() => splitAmount(executor, budget), [executor, budget])
  const fee = Math.round(budget * 0.05)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in to post a task.")
      return
    }

    setError("")
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const title = form.get("title") as string
    const category = form.get("category") as string
    const skillsRaw = form.get("skills") as string
    const description = form.get("desc") as string

    const skills = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const supabase = createClient()

    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Anonymous"

    const { error: insertError } = await supabase.from("tasks").insert({
      title,
      description,
      task_type: category.toLowerCase(),
      category,
      executor_type: executor,
      bounty_amount: budget,
      skills,
      tags: skills,
      poster_id: user.id,
      poster_address: user.email ?? "",
      poster_name: userName,
      status: "open",
    })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
    >
      {/* Left: details */}
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold">Task details</h2>

          {error && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Task title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="e.g. Build an automated lead-scoring pipeline"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  className="h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="bg-card">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="skills">Required skills</Label>
                <Input id="skills" name="skills" placeholder="e.g. Python, Webhooks, LLM" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                name="desc"
                required
                rows={6}
                placeholder="Describe the goal, deliverables, and any tools or systems involved."
              />
            </div>
          </div>
        </Card>

        {/* Executor selection */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold">Who should do it?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how this task gets done. This determines how the payment is routed.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {options.map((o) => {
              const active = executor === o.id
              const meta = executorMeta[o.id]
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setExecutor(o.id)}
                  className={cn(
                    "relative rounded-xl border p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/40 hover:border-primary/40",
                  )}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      active
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    <o.icon className="size-4.5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{meta.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {meta.description}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Label htmlFor="budget">Budget (USD)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="budget"
                type="number"
                min={100}
                step={50}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Right: payment routing summary */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Wallet className="size-4.5 text-primary" />
            <h2 className="font-heading text-base font-semibold">
              Payment routing
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            How <span className="text-foreground">${budget.toLocaleString()}</span> will
            be distributed on completion.
          </p>

          {/* split bar */}
          <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="bg-primary transition-all"
              style={{ width: `${split.company}%` }}
            />
            <div
              className="bg-sky-400 transition-all"
              style={{ width: `${split.freelancer}%` }}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <SplitRow
              icon={<Building2 className="size-4" />}
              label="AgentHive (agent)"
              pct={split.company}
              amount={amounts.company}
              tone="text-primary"
            />
            <SplitRow
              icon={<User className="size-4" />}
              label="Freelancer"
              pct={split.freelancer}
              amount={amounts.freelancer}
              tone="text-sky-300"
            />
          </div>

          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Task budget</span>
              <span className="text-foreground">${budget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform fee (5%)</span>
              <span className="text-foreground">${fee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total charged</span>
              <span className="font-heading text-base">
                ${(budget + fee).toLocaleString()}
              </span>
            </div>
          </div>

          <p className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {executorMeta[executor].description}
          </p>

          <Button type="submit" size="lg" className="mt-5 w-full rounded-xl" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Post task
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </Card>
      </div>
    </form>
  )
}

function SplitRow({
  icon,
  label,
  pct,
  amount,
  tone,
}: {
  icon: React.ReactNode
  label: string
  pct: number
  amount: number
  tone: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm">
        <span className={cn("flex size-7 items-center justify-center rounded-md bg-secondary", tone)}>
          {icon}
        </span>
        {label}
      </span>
      <span className="text-right">
        <span className="block text-sm font-semibold">
          ${amount.toLocaleString()}
        </span>
        <span className="block text-xs text-muted-foreground">{pct}%</span>
      </span>
    </div>
  )
}

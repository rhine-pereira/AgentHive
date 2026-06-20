"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Loader2,
  Shield,
  Sparkles,
  Zap,
  ChevronDown,
  AlertTriangle,
  User,
  Download,
  FileCode2,
  Brain,
  FileSearch,
  Code2,
  Search,
  Lightbulb,
  Wrench,
  FolderOpen,
  File,
  Play,
  Code,
  Monitor,
  Hexagon,
} from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { executorMeta, statusMeta } from "@/lib/data"

// ── Types ──────────────────────────────────────────────────────

type Phase = {
  id: string
  label: string
  icon: typeof Brain
  thoughts: string[]
  status: "pending" | "active" | "done"
  duration?: number
}

// ── Pulsing dot ────────────────────────────────────────────────

function PulsingDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex size-2.5">
      {active && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full",
          active ? "bg-emerald-400" : "bg-muted-foreground/30",
        )}
      />
    </span>
  )
}

// ── Thinking step ──────────────────────────────────────────────

function ThinkingStep({ phase }: { phase: Phase }) {
  const [expanded, setExpanded] = useState(phase.status === "active")

  useEffect(() => {
    if (phase.status === "active") setExpanded(true)
  }, [phase.status])

  const Icon = phase.icon

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-500",
        phase.status === "active"
          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
          : phase.status === "done"
            ? "border-border bg-card"
            : "border-border/50 bg-card/50 opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 p-4"
      >
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-all",
            phase.status === "active"
              ? "bg-primary/20 text-primary"
              : phase.status === "done"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-secondary text-muted-foreground",
          )}
        >
          {phase.status === "active" ? (
            <Loader2 className="size-4.5 animate-spin" />
          ) : phase.status === "done" ? (
            <CheckCircle2 className="size-4.5" />
          ) : (
            <Icon className="size-4.5" />
          )}
        </div>
        <div className="flex-1 text-left">
          <p className={cn("text-sm font-medium", phase.status === "active" ? "text-primary" : "text-foreground")}>
            {phase.label}
          </p>
          {phase.status === "done" && phase.duration && (
            <p className="text-xs text-muted-foreground">
              Completed in {(phase.duration / 1000).toFixed(1)}s
            </p>
          )}
        </div>
        <PulsingDot active={phase.status === "active"} />
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      <div className={cn("overflow-hidden transition-all duration-300", expanded ? "max-h-[500px]" : "max-h-0")}>
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1.5">
            {phase.thoughts.map((thought, i) => (
              <div
                key={i}
                className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span
                  className={cn(
                    "text-xs font-mono leading-relaxed",
                    i === phase.thoughts.length - 1 && phase.status === "active"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {thought}
                  {i === phase.thoughts.length - 1 && phase.status === "active" && (
                    <span className="ml-1 inline-block h-3 w-px animate-pulse bg-primary" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Code block with copy button ────────────────────────────────

function CodeBlock({ code, filename }: { code: string; filename?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 bg-secondary/20 px-4 py-2">
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileCode2 className="size-3.5" />
          {filename || "output"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-emerald-300/90">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ── Parse output into sections ─────────────────────────────────

function AgentOutputDisplay({ output }: { output: string }) {
  // Split output into text blocks and code blocks
  const parts: { type: "text" | "code"; content: string; lang?: string; filename?: string }[] = []
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(output)) !== null) {
    if (match.index > lastIndex) {
      const text = output.slice(lastIndex, match.index).trim()
      if (text) parts.push({ type: "text", content: text })
    }
    const lang = match[1] || ""
    const code = match[2].trim()
    // Try to extract filename from first line comment
    const firstLine = code.split("\n")[0]
    let filename = lang
    if (firstLine.match(/^(\/\/|#|<!--)\s*\S+\.\w+/)) {
      filename = firstLine.replace(/^(\/\/|#|<!--)\s*/, "").replace(/\s*-->$/, "").trim()
    } else if (lang === "html") {
      filename = "index.html"
    } else if (lang === "css") {
      filename = "styles.css"
    } else if (lang === "javascript" || lang === "js") {
      filename = "script.js"
    }
    parts.push({ type: "code", content: code, lang, filename })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < output.length) {
    const text = output.slice(lastIndex).trim()
    if (text) parts.push({ type: "text", content: text })
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content: output })
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden w-full max-w-full">
      {parts.map((part, i) =>
        part.type === "code" ? (
          <CodeBlock key={i} code={part.content} filename={part.filename} />
        ) : (
          <div key={i} className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
            {part.content.replace(/^#+\s*/gm, "")}
          </div>
        ),
      )}
    </div>
  )
}

// ── Progress bar ───────────────────────────────────────────────

function AgentProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="bg-gradient-to-r from-primary via-emerald-400 to-primary transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

// ── Phase icon map ─────────────────────────────────────────────

const phaseIconMap: Record<string, typeof Brain> = {
  understanding: FileSearch,
  planning: Brain,
  thinking: Lightbulb,
  analyzing: Search,
  executing: Code2,
  validating: Shield,
  complete: CheckCircle2,
}

// ── Main page ──────────────────────────────────────────────────

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const taskId = params.id as string

  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [agentRunning, setAgentRunning] = useState(false)
  const [phases, setPhases] = useState<Phase[]>([])
  const [agentOutput, setAgentOutput] = useState<string | null>(null)
  const [streamingOutput, setStreamingOutput] = useState<string>("") // live token buffer
  const [reasoningOutput, setReasoningOutput] = useState<string>("") // thinking tokens
  const [agentSummary, setAgentSummary] = useState<string | null>(null)
  const [agentQuality, setAgentQuality] = useState<number>(0)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [createdFiles, setCreatedFiles] = useState<{name: string, size: number}[]>([])
  const [toolCalls, setToolCalls] = useState<{name: string, args: any}[]>([])
  
  // Freelancer workflow state
  const [applications, setApplications] = useState<any[]>([])
  const [coverLetter, setCoverLetter] = useState("")
  const [workSubmission, setWorkSubmission] = useState("")
  const [loadingApp, setLoadingApp] = useState(false)
  
  // New State for Preview / Code Viewer
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [isLoadingFile, setIsLoadingFile] = useState(false)

  const phaseStartTimes = useRef<Record<string, number>>({})
  const streamEndRef = useRef<HTMLDivElement>(null)
  const thinkingEndRef = useRef<HTMLDivElement>(null)

  // Fetch file content when selected
  useEffect(() => {
    if (selectedFile) {
      setIsLoadingFile(true)
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tasks/${task?.id || taskId}/files/${selectedFile}`)
        .then((res) => res.text())
        .then((text) => {
          setFileContent(text)
          setIsLoadingFile(false)
        })
        .catch(() => {
          setFileContent("Error loading file")
          setIsLoadingFile(false)
        })
    }
  }, [selectedFile, task?.id, taskId])

  // Auto-select index.html or first file
  useEffect(() => {
    if (createdFiles.length > 0 && !selectedFile) {
      const indexFile = createdFiles.find(f => f.name === 'index.html')
      setSelectedFile(indexFile ? indexFile.name : createdFiles[0].name)
    }
  }, [createdFiles, selectedFile])

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"

  // Fetch task
  useEffect(() => {
    async function fetchTask() {
      const supabase = createClient()
      const { data } = await supabase.from("tasks").select("*").eq("id", taskId).single()
      if (data) {
        setTask(data)
        // If task already has result_content, show it
        if (data.result_content) {
          setAgentOutput(data.result_content)
          setAgentSummary(data.result_summary || "")
          setAgentQuality(data.quality_score || 0)
          
          // Fetch files from workspace
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tasks/${taskId}/files`)
            .then(r => r.json())
            .then(res => {
              if (res.files && res.files.length > 0) {
                setCreatedFiles(res.files)
              }
            })
            .catch(e => console.error("Failed to load workspace files:", e))
        }
      }
      setLoading(false)
    }
    fetchTask()
  }, [taskId])

  // Run agent via SSE
  async function startAgent() {
    if (!task || agentRunning) return
    setAgentRunning(true)
    setAgentOutput(null)
    setStreamingOutput("")
    setReasoningOutput("")
    setCreatedFiles([])
    setToolCalls([])
    setAgentError(null)
    setPhases([])

    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${taskId}/execute`, {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error("No response stream")

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const event = JSON.parse(jsonStr)

            if (event.type === "phase_start") {
              phaseStartTimes.current[event.phase] = Date.now()
              setPhases((prev) => {
                const updated = prev.map((p) =>
                  p.status === "active" ? { ...p, status: "done" as const, duration: Date.now() - (phaseStartTimes.current[p.id] || Date.now()) } : p,
                )
                return [
                  ...updated,
                  {
                    id: event.phase,
                    label: event.label,
                    icon: phaseIconMap[event.phase] || Brain,
                    thoughts: [],
                    status: "active" as const,
                  },
                ]
              })
            }

            if (event.type === "thought") {
              setPhases((prev) =>
                prev.map((p) =>
                  p.id === event.phase ? { ...p, thoughts: [...p.thoughts, event.text] } : p,
                ),
              )
            }

            if (event.type === "phase_done") {
              setPhases((prev) =>
                prev.map((p) =>
                  p.id === event.phase
                    ? { ...p, status: "done" as const, duration: Date.now() - (phaseStartTimes.current[p.id] || Date.now()) }
                    : p,
                ),
              )
            }

            if (event.type === "reasoning") {
              setReasoningOutput((prev) => {
                const next = prev + event.text
                requestAnimationFrame(() => thinkingEndRef.current?.scrollIntoView({ behavior: "smooth" }))
                return next
              })
            }

            if (event.type === "token") {
              setStreamingOutput((prev) => {
                const next = prev + event.text
                requestAnimationFrame(() => streamEndRef.current?.scrollIntoView({ behavior: "smooth" }))
                return next
              })
            }

            if (event.type === "tool_call") {
              setToolCalls((prev) => [...prev, { name: event.name, args: event.args }])
            }

            if (event.type === "file_created") {
              setCreatedFiles((prev) => [...prev, { name: event.filename, size: event.size }])
            }

            if (event.type === "complete") {
              const files = event.files || []
              if (files.length > 0) {
                setCreatedFiles(files)
              }
              setAgentOutput(event.summary || "Task complete")
              setStreamingOutput("")
              setReasoningOutput("")
              setAgentSummary(event.summary)
              setAgentQuality(event.quality || 0)
              setTask((prev: any) => ({ ...prev, status: "review" }))
            }

            if (event.type === "error") {
              setAgentError(event.message)
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err: any) {
      setAgentError(err.message || "Failed to connect to agent")
    }

    setAgentRunning(false)
  }

  // ── Freelancer Handlers ────────────────────────────────────────

  const fetchApplications = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${taskId}/applications`)
      const data = await res.json()
      if (data.applications) setApplications(data.applications)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (task && (task.executor_type === 'human' || task.executor_type === 'freelancer' || task.executor_type === 'both')) {
      fetchApplications()
    }
  }, [task?.executor_type])

  const handleApply = async () => {
    if (!user || !coverLetter) return
    setLoadingApp(true)
    try {
      await fetch(`http://localhost:8000/api/tasks/${taskId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancer_id: user.id, cover_letter: coverLetter })
      })
      await fetchApplications()
      setCoverLetter("")
    } catch (e) {
      console.error(e)
    }
    setLoadingApp(false)
  }

  const handleAccept = async (appId: string) => {
    try {
      await fetch(`http://localhost:8000/api/tasks/${taskId}/applications/${appId}/accept`, { method: "POST" })
      window.location.reload()
    } catch (e) {}
  }

  const handleSubmitWork = async () => {
    if (!workSubmission) return
    setLoadingApp(true)
    try {
      await fetch(`http://localhost:8000/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission: workSubmission })
      })
      window.location.reload()
    } catch (e) {}
    setLoadingApp(false)
  }

  const handleApproveWork = async () => {
    try {
      await fetch(`http://localhost:8000/api/tasks/${taskId}/approve_work`, { method: "POST" })
      window.location.reload()
    } catch (e) {}
  }

  // Progress calculation
  const totalPhases = phases.length || 4
  const donePhases = phases.filter((p) => p.status === "done").length
  const progress = agentOutput ? 100 : Math.round(((donePhases + (phases.some((p) => p.status === "active") ? 0.5 : 0)) / totalPhases) * 100)

  if (loading) {
    return (
      <AppShell role="client" userName={userName}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (!task) {
    return (
      <AppShell role="client" userName={userName}>
        <div className="py-20 text-center">
          <AlertTriangle className="mx-auto size-12 text-muted-foreground/50" />
          <h2 className="mt-4 font-heading text-xl font-semibold">Task not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">This task may have been deleted or doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline" className="mt-6 rounded-xl">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </div>
      </AppShell>
    )
  }

  const status = statusMeta[task.status as keyof typeof statusMeta] || statusMeta.open
  const executorType = task.executor_type || "agent"
  const executorInfo = executorMeta[executorType as keyof typeof executorMeta] || executorMeta.agent
  const skills: string[] = task.skills || task.tags || []
  const isAgentTask = executorType === "agent" || executorType === "both"
  const isHumanTask = executorType === "human" || executorType === "both"
  const isClient = user?.id === task.poster_id
  
  const userApplication = applications.find(a => a.freelancer_id === user?.id)

  return (
    <AppShell role="client" userName={userName}>
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left */}
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">{task.category || task.task_type}</span>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", status.tone)}>{status.label}</span>
            </div>
            <h1 className="mt-3 font-heading text-2xl font-semibold leading-tight">{task.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{task.description}</p>
            {skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {skills.map((s: string) => (<Badge key={s}>{s}</Badge>))}
              </div>
            )}
            <div className="mt-5 flex items-center gap-6 border-t border-border pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="size-4" />{task.poster_name || "Anonymous"}</span>
              <span className="flex items-center gap-1.5"><Clock className="size-4" />{new Date(task.created_at).toLocaleDateString()}</span>
              <span className="font-heading text-lg font-semibold text-foreground">${Number(task.bounty_amount).toLocaleString()}</span>
            </div>
          </Card>

          {/* Agent panel */}
          {isAgentTask && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border bg-card p-5">
                <div className={cn("flex size-10 items-center justify-center rounded-xl", agentRunning ? "bg-primary/20" : agentOutput ? "bg-emerald-500/15" : "bg-secondary")}>
                  {agentRunning ? <Bot className="size-5 text-primary animate-pulse" /> : agentOutput ? <CheckCircle2 className="size-5 text-emerald-400" /> : <Bot className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <h2 className="font-heading text-base font-semibold">
                    {agentOutput ? "Agent completed" : agentRunning ? "Agent is working..." : "AI Agent Execution"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {agentOutput ? `Quality score: ${agentQuality}/100` : agentRunning ? `Nemotron Ultra 550B • Reasoning enabled` : `${executorInfo.label} • Ready to execute`}
                  </p>
                </div>
                {!agentRunning && !agentOutput && (
                  <Button onClick={startAgent} className="rounded-xl gap-2">
                    <Zap className="size-4" />
                    Run Agent
                  </Button>
                )}
              </div>

              {(agentRunning || agentOutput || phases.length > 0) && (
                <div className="px-5 pt-4">
                  <AgentProgressBar progress={progress} />
                  <p className="mt-1.5 text-right text-xs text-muted-foreground">{progress}% complete</p>
                </div>
              )}

              {phases.length > 0 && (
                <div className="flex flex-col gap-3 p-5">
                  {phases.map((phase) => (
                    <ThinkingStep key={phase.id} phase={phase} />
                  ))}
                </div>
              )}

              {/* Live reasoning stream — shows agent's chain-of-thought */}
              {reasoningOutput && !agentOutput && (
                <div className="border-t border-border p-5">
                  <div className="rounded-xl border border-amber-500/20 bg-[#1a1500] overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2">
                      <Lightbulb className="size-3.5 text-amber-400 animate-pulse" />
                      <span className="text-xs text-amber-400/80 font-mono font-medium">Agent Thinking...</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-4">
                      <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-amber-200/60 italic">
                        {reasoningOutput}
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-amber-400" />
                      </pre>
                      <div ref={thinkingEndRef} />
                    </div>
                  </div>
                </div>
              )}

              {/* Agent Loading Animation */}
              {(agentRunning || (!agentOutput && streamingOutput)) && (
                <div className="border-t border-border p-12 flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center mb-6">
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                    
                    {/* Core Hexagon Logo */}
                    <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 shadow-xl shadow-primary/20">
                      <Hexagon className="size-10 text-black fill-current animate-pulse" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">AgentHive is Building</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" />
                    {streamingOutput.slice(-60).trim() || "Executing tool calls..."}
                  </p>
                </div>
              )}

              {agentError && (
                <div className="border-t border-border p-5">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="size-4" />
                      <span className="text-sm font-semibold">Agent Error</span>
                    </div>
                    <p className="mt-2 text-sm text-red-300/80">{agentError}</p>
                  </div>
                </div>
              )}

              {/* Live file creation activity */}
              {createdFiles.length > 0 && !agentOutput && (
                <div className="border-t border-border p-5">
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="flex items-center gap-2 text-cyan-400 mb-3">
                      <FolderOpen className="size-4" />
                      <span className="text-sm font-semibold">Files Created ({createdFiles.length})</span>
                    </div>
                    <div className="space-y-1.5">
                      {createdFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <File className="size-3 text-cyan-400/60" />
                          <span className="font-mono text-foreground/80">{f.name}</span>
                          <span className="text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {agentOutput && (
                <div className="border-t border-border p-0">
                  <div className="flex flex-col h-[700px]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-border bg-secondary/10">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Sparkles className="size-4.5" />
                        <span className="font-semibold text-foreground">Generated Project</span>
                        <Badge className="ml-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono">
                          {agentQuality}/100 Quality
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {createdFiles.length > 0 && (
                          <div className="flex p-1 bg-background/50 backdrop-blur-md rounded-lg border border-border">
                            <button
                              onClick={() => setActiveTab('preview')}
                              className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", activeTab === 'preview' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground")}
                            >
                              <Monitor className="size-4" />
                              Preview
                            </button>
                            <button
                              onClick={() => setActiveTab('code')}
                              className={cn("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", activeTab === 'code' ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground")}
                            >
                              <Code2 className="size-4" />
                              Code
                            </button>
                          </div>
                        )}
                        
                        {createdFiles.length > 0 && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tasks/${task?.id || taskId}/download`}
                            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Download className="size-4" />
                            Export ZIP
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden relative bg-[#0a0a0a]">
                      {createdFiles.length === 0 ? (
                        <div className="h-full overflow-y-auto p-6">
                          <AgentOutputDisplay output={agentOutput} />
                        </div>
                      ) : activeTab === 'preview' ? (
                        <div className="absolute inset-0 w-full h-full p-4">
                          <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-border shadow-2xl relative">
                            <iframe 
                              src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tasks/${task?.id || taskId}/files/index.html`}
                              className="w-full h-full border-0 absolute inset-0"
                              title="Project Preview"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full">
                          {/* Sidebar File Explorer */}
                          <div className="w-64 border-r border-border bg-[#0d1117] flex flex-col">
                            <div className="p-3 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                              <FolderOpen className="size-3.5" />
                              Workspace Files
                            </div>
                            <div className="flex-1 overflow-y-auto py-2">
                              {createdFiles.map((f, i) => (
                                <button
                                  key={i}
                                  onClick={() => setSelectedFile(f.name)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left",
                                    selectedFile === f.name 
                                      ? "bg-primary/10 text-primary border-r-2 border-primary" 
                                      : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                                  )}
                                >
                                  <FileCode2 className="size-4 shrink-0" />
                                  <span className="truncate">{f.name}</span>
                                </button>
                              ))}
                            </div>
                            {agentSummary && (
                              <div className="p-4 border-t border-border/50 bg-[#0a0a0a]">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {agentSummary}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Code Viewer */}
                          <div className="flex-1 overflow-hidden flex flex-col bg-[#050505]">
                            <div className="px-4 py-2 border-b border-border/50 bg-[#0a0a0a] flex items-center gap-2 text-sm text-muted-foreground">
                              <File className="size-4" />
                              {selectedFile || "Select a file"}
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                              {isLoadingFile ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                  <Loader2 className="size-6 animate-spin" />
                                </div>
                              ) : (
                                <pre className="text-sm font-mono text-emerald-300/90 leading-relaxed">
                                  <code>{fileContent}</code>
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Freelancer panel */}
          {(() => {
            const isHumanTask = task.executor_type === 'human' || task.executor_type === 'freelancer' || task.executor_type === 'both';
            const isClient = user?.id === task.poster_id;
            return isHumanTask && (
              <Card className="overflow-hidden mt-6">
                <div className="flex items-center gap-3 border-b border-border bg-card p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15">
                    <User className="size-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-heading text-base font-semibold">Human Execution</h2>
                    <p className="text-xs text-muted-foreground">
                      Freelancer workflow status: {task.freelancer_status || 'open'}
                    </p>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  {!isClient ? (
                    // FREELANCER VIEW
                    <>
                      {!userApplication && task.status === 'open' && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Cover Letter / Proposal</label>
                          <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Why are you a good fit?"
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                          />
                          <Button onClick={handleApply} disabled={loadingApp || !coverLetter}>
                            {loadingApp ? <Loader2 className="size-4 animate-spin" /> : "Apply for Task"}
                          </Button>
                        </div>
                      )}
                      {userApplication && userApplication.status === 'pending' && (
                        <div className="rounded-lg bg-secondary/50 p-4 text-center">
                          <p className="text-sm text-muted-foreground">Your application is pending review by the client.</p>
                        </div>
                      )}
                      {userApplication && userApplication.status === 'accepted' && task.freelancer_status === 'assigned' && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-emerald-400">You were selected! Submit your work here:</label>
                          <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Link to repo, Google Doc, or direct text..."
                            value={workSubmission}
                            onChange={(e) => setWorkSubmission(e.target.value)}
                          />
                          <Button onClick={handleSubmitWork} disabled={loadingApp || !workSubmission}>
                            {loadingApp ? <Loader2 className="size-4 animate-spin" /> : "Submit Work"}
                          </Button>
                        </div>
                      )}
                      {task.freelancer_status === 'submitted' && (
                        <div className="rounded-lg bg-secondary/50 p-4 text-center">
                          <p className="text-sm text-muted-foreground">Work submitted. Awaiting client approval.</p>
                        </div>
                      )}
                      {task.freelancer_status === 'approved' && (
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                          <p className="text-sm font-medium text-emerald-400">Work approved! Payment will be sent to your wallet.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // CLIENT VIEW
                    <>
                      {task.status === 'open' && applications.length === 0 && (
                        <p className="text-sm text-muted-foreground">No applications yet.</p>
                      )}
                      {task.status === 'open' && applications.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Applicants ({applications.length})</h3>
                          {applications.map(app => (
                            <div key={app.id} className="rounded-lg border border-border p-4 bg-secondary/20">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-sm">{app.freelancer?.full_name || 'Anonymous Freelancer'}</span>
                                <Button size="sm" variant="outline" onClick={() => handleAccept(app.id)}>Accept</Button>
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{app.cover_letter}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {task.freelancer_status === 'assigned' && (
                        <div className="rounded-lg bg-secondary/50 p-4 text-center">
                          <p className="text-sm text-muted-foreground">Freelancer is working on the task.</p>
                        </div>
                      )}
                      {task.freelancer_status === 'submitted' && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Work Submission</h3>
                          <div className="rounded-lg border border-border p-4 bg-secondary/20">
                            <p className="text-sm whitespace-pre-wrap">{task.freelancer_submission}</p>
                          </div>
                          <Button onClick={handleApproveWork} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">Approve & Release Payment</Button>
                        </div>
                      )}
                      {task.freelancer_status === 'approved' && (
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                          <p className="text-sm font-medium text-emerald-400">You approved the work. Payment process initiated.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })()}

        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Execution</h3>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
              <div className={cn("flex size-9 items-center justify-center rounded-lg", executorType === "agent" ? "bg-primary/15 text-primary" : executorType === "freelancer" ? "bg-sky-500/15 text-sky-400" : "bg-amber-500/15 text-amber-400")}>
                {executorType === "agent" ? <Bot className="size-4.5" /> : executorType === "freelancer" ? <User className="size-4.5" /> : <Zap className="size-4.5" />}
              </div>
              <div>
                <p className="text-sm font-medium">{executorInfo.label}</p>
                <p className="text-xs text-muted-foreground">{executorInfo.description}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold">Budget</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bounty</span>
                <span className="font-medium">${Number(task.bounty_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (5%)</span>
                <span className="font-medium">${Math.round(Number(task.bounty_amount) * 0.05).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span className="font-heading text-base">${Math.round(Number(task.bounty_amount) * 1.05).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold">Status</h3>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current</span>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", status.tone)}>{status.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Posted</span>
                <span>{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

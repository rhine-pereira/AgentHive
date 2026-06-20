export type ExecutorType = "agent" | "freelancer" | "both"
export type TaskStatus = "open" | "in_progress" | "review" | "completed"
export type Role = "client" | "freelancer"

export type PaymentSplit = {
  company: number
  freelancer: number
}

/**
 * Payment routing rules for AgentHive:
 * - agent      -> the in-house AgentHive agent performs the task, 100% to the company
 * - freelancer -> a human freelancer performs the task, 100% to the freelancer
 * - both       -> agent + freelancer collaborate, 50% company / 50% freelancer
 */
export function getPaymentSplit(executor: ExecutorType): PaymentSplit {
  switch (executor) {
    case "agent":
      return { company: 100, freelancer: 0 }
    case "freelancer":
      return { company: 0, freelancer: 100 }
    case "both":
      return { company: 50, freelancer: 50 }
  }
}

export function splitAmount(executor: ExecutorType, budget: number) {
  const split = getPaymentSplit(executor)
  return {
    company: Math.round((budget * split.company) / 100),
    freelancer: Math.round((budget * split.freelancer) / 100),
  }
}

export const executorMeta: Record<
  ExecutorType,
  { label: string; short: string; description: string }
> = {
  agent: {
    label: "AI Agent",
    short: "Agent",
    description: "An in-house AgentHive agent runs the task end-to-end. Payment goes to AgentHive.",
  },
  freelancer: {
    label: "Freelancer",
    short: "Freelancer",
    description: "A vetted human freelancer delivers the work. Payment goes to the freelancer.",
  },
  both: {
    label: "Agent + Freelancer",
    short: "Hybrid",
    description: "An agent drafts the work and a freelancer refines it. Payment is split 50 / 50.",
  },
}

export type Task = {
  id: string
  title: string
  category: string
  description: string
  budget: number
  executor: ExecutorType
  status: TaskStatus
  client: string
  postedAgo: string
  proposals: number
  skills: string[]
}

export const tasks: Task[] = [
  {
    id: "t-1024",
    title: "Build an automated lead-scoring pipeline",
    category: "Automation",
    description:
      "Connect our CRM to an enrichment API and score inbound leads in real time. Output should sync back to HubSpot with a custom score field.",
    budget: 2400,
    executor: "agent",
    status: "open",
    client: "Northwind Labs",
    postedAgo: "2h ago",
    proposals: 7,
    skills: ["HubSpot", "Webhooks", "LLM"],
  },
  {
    id: "t-1025",
    title: "Design a 6-page marketing site in Figma",
    category: "Design",
    description:
      "Need a polished dark-themed SaaS marketing site, mobile-first, with a component library and prototype.",
    budget: 1800,
    executor: "freelancer",
    status: "in_progress",
    client: "Lumen AI",
    postedAgo: "1d ago",
    proposals: 14,
    skills: ["Figma", "Web Design", "Prototyping"],
  },
  {
    id: "t-1026",
    title: "Migrate analytics events to a warehouse",
    category: "Data",
    description:
      "Pipe product events into BigQuery, set up dbt models, and build a starter dashboard. Agent handles ingestion, freelancer reviews models.",
    budget: 3200,
    executor: "both",
    status: "open",
    client: "Cobalt",
    postedAgo: "5h ago",
    proposals: 4,
    skills: ["BigQuery", "dbt", "SQL"],
  },
  {
    id: "t-1027",
    title: "Write 12 SEO blog posts on AI ops",
    category: "Content",
    description:
      "Long-form, well-researched articles (1,500+ words) with internal linking. Agent drafts, freelancer edits for voice.",
    budget: 1500,
    executor: "both",
    status: "review",
    client: "Stride",
    postedAgo: "3d ago",
    proposals: 21,
    skills: ["SEO", "Copywriting", "Editing"],
  },
  {
    id: "t-1028",
    title: "Customer support triage bot",
    category: "Automation",
    description:
      "Classify and route incoming Zendesk tickets, draft replies for common issues, escalate the rest.",
    budget: 2750,
    executor: "agent",
    status: "open",
    client: "Beacon",
    postedAgo: "8h ago",
    proposals: 9,
    skills: ["Zendesk", "NLP", "Routing"],
  },
  {
    id: "t-1029",
    title: "Brand identity & logo system",
    category: "Design",
    description:
      "Complete brand kit: logo, type scale, color tokens, and usage guidelines for a fintech startup.",
    budget: 2100,
    executor: "freelancer",
    status: "completed",
    client: "Vault",
    postedAgo: "1w ago",
    proposals: 30,
    skills: ["Branding", "Illustration"],
  },
]

export function getTask(id: string) {
  return tasks.find((t) => t.id === id)
}

export type Freelancer = {
  name: string
  handle: string
  title: string
  rating: number
  reviews: number
  hourly: number
  location: string
  skills: string[]
  bio: string
  completed: number
  earned: string
}

export const currentFreelancer: Freelancer = {
  name: "Maya Okafor",
  handle: "mayao",
  title: "Automation Engineer & AI Workflow Specialist",
  rating: 4.9,
  reviews: 128,
  hourly: 85,
  location: "Lisbon, PT",
  skills: ["Python", "LLM Orchestration", "Zapier", "BigQuery", "Next.js", "APIs"],
  bio: "I build reliable automations and AI agents for ops-heavy teams. 6 years shipping pipelines that quietly save companies thousands of hours.",
  completed: 214,
  earned: "$182k",
}

export type ClientProfile = {
  name: string
  company: string
  email: string
  location: string
  spent: string
  postedTasks: number
  hireRate: number
}

export const currentClient: ClientProfile = {
  name: "Daniel Reyes",
  company: "Northwind Labs",
  email: "daniel@northwind.io",
  location: "Austin, TX",
  spent: "$48,200",
  postedTasks: 37,
  hireRate: 92,
}

export const statusMeta: Record<TaskStatus, { label: string; tone: string }> = {
  open: { label: "Open", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" },
  in_progress: { label: "In progress", tone: "text-sky-300 bg-sky-500/10 border-sky-500/20" },
  review: { label: "In review", tone: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  completed: { label: "Completed", tone: "text-violet-300 bg-violet-500/10 border-violet-500/20" },
}

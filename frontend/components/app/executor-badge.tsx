import { Bot, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { executorMeta, type ExecutorType } from "@/lib/data"

const icons = {
  agent: Bot,
  freelancer: User,
  both: Users,
} as const

export function ExecutorBadge({
  executor,
  className,
}: {
  executor: ExecutorType
  className?: string
}) {
  const Icon = icons[executor]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {executorMeta[executor].short}
    </span>
  )
}

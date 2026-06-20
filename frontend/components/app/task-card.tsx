import Link from "next/link"
import { Clock, Users2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExecutorBadge } from "@/components/app/executor-badge"
import { statusMeta, type Task } from "@/lib/data"
import { cn } from "@/lib/utils"

export function TaskCard({ task }: { task: Task }) {
  const status = statusMeta[task.status]
  return (
    <Link href={`/tasks/${task.id}`} className="group block">
      <Card className="h-full p-5 transition-colors hover:border-primary/40">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {task.category}
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-medium",
              status.tone,
            )}
          >
            {status.label}
          </span>
        </div>

        <h3 className="mt-3 font-heading text-base font-semibold leading-snug text-balance group-hover:text-primary">
          {task.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
          {task.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {task.skills.slice(0, 3).map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="font-heading text-lg font-semibold">
              {task.budget.toLocaleString()} MON
            </p>
            <p className="text-xs text-muted-foreground">fixed budget</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ExecutorBadge executor={task.executor} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {task.postedAgo}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users2 className="size-3.5" />
                {task.proposals}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

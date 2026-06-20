import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function Avatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-sm font-semibold text-primary",
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

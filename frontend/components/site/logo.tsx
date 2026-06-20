import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn('size-6', className)}
      fill="none"
    >
      {/* hive hexagon */}
      <path
        d="M12 1.5 21 6.75v10.5L12 22.5 3 17.25V6.75L12 1.5Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M12 6 16.5 8.6v5.2L12 16.4 7.5 13.8V8.6L12 6Z"
        fill="var(--background)"
      />
      <path d="M12 9 14.2 10.3v2.4L12 14l-2.2-1.3v-2.4L12 9Z" fill="currentColor" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <LogoMark className="size-7 text-primary" />
      <span className="font-heading text-lg font-semibold tracking-tight">
        AgentHive
      </span>
    </Link>
  )
}

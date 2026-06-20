"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Compass,
  User as UserIcon,
  Wallet,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Code2,
} from "lucide-react"
import { Logo } from "@/components/site/logo"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Role } from "@/lib/data"
import { useAuth } from "@/components/auth/auth-provider"

function UserAvatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeClass = size === 'sm' ? 'size-8 text-xs' : 'size-9 text-sm'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(sizeClass, 'rounded-full object-cover ring-2 ring-border')}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <div
      className={cn(
        sizeClass,
        'flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ring-2 ring-border',
      )}
    >
      {initials || '?'}
    </div>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 py-1 pl-3 pr-1 transition-colors hover:bg-secondary"
      >
        <span className="hidden text-sm font-medium text-foreground sm:block">
          {name}
        </span>
        <ChevronDown className={cn('hidden size-3.5 text-muted-foreground transition-transform sm:block', open && 'rotate-180')} />
        <UserAvatar name={name} avatarUrl={avatarUrl} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <div className="p-1">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                await signOut()
                window.location.href = '/'
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard }

const clientNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks/new", label: "Post a task", icon: PlusCircle },
  { href: "/tasks", label: "Browse tasks", icon: Compass },
  { href: "/tasks", label: "My contracts", icon: ListChecks },
  { href: "/dashboard/earnings", label: "Earnings", icon: Wallet },
  { href: "/ide", label: "Smart Contract IDE", icon: Code2 },
  { href: "/profile/client", label: "Profile", icon: UserIcon },
]

const freelancerNav: NavItem[] = [
  { href: "/freelancer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Find work", icon: Compass },
  { href: "/freelancer/contracts", label: "My contracts", icon: ListChecks },
  { href: "/freelancer/earnings", label: "Earnings", icon: Wallet },
  { href: "/ide", label: "Smart Contract IDE", icon: Code2 },
  { href: "/profile/freelancer", label: "Profile", icon: UserIcon },
]

export function AppShell({
  role: defaultRole,
  userName,
  children,
}: {
  role?: string
  userName: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  
  const role = user?.user_metadata?.role || defaultRole || "client"
  const nav = role === "client" ? clientNav : freelancerNav

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] border-r border-border bg-card/60 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <span className="ml-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {role === "client" ? "Client workspace" : "Freelancer workspace"}
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/freelancer" &&
                pathname.startsWith(item.href))
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn("size-4.5", active && "text-primary")}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <Link
            href={role === "client" ? "/profile/client" : "/profile/freelancer"}
            className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary/60"
          >
            <Avatar name={userName} className="size-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {role}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="relative hidden flex-1 max-w-md sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search tasks, freelancers..."
              className="h-10 w-full rounded-xl border border-input bg-secondary/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4.5" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary" />
            </button>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}

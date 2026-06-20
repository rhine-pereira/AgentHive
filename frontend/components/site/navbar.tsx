'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/site/logo'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/auth-provider'

const links = [
  { label: 'How it works', href: '#process' },
  { label: 'Services', href: '#services' },
  { label: 'Find work', href: '#tasks' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQs', href: '#faqs' },
]

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
            <a
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </a>
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

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <div className="size-9 animate-pulse rounded-full bg-secondary" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <Button
                render={<a href="/login" />}
                variant="ghost"
                className="rounded-full px-4"
              >
                Log in
              </Button>
              <Button render={<a href="/signup" />} className="rounded-full px-5">
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-md text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <div
        className={cn(
          'overflow-hidden border-t border-border/60 md:hidden',
          open ? 'max-h-[30rem]' : 'max-h-0 border-t-0',
          'transition-all duration-300',
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </a>
          ))}

          {loading ? null : user ? (
            <>
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-3">
                <UserAvatar
                  name={user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  avatarUrl={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                render={<a href="/dashboard" onClick={() => setOpen(false)} />}
                variant="outline"
                className="mt-2 rounded-full"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="rounded-full text-red-400 hover:text-red-300"
                onClick={async () => {
                  setOpen(false)
                  await signOut()
                  window.location.href = '/'
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                render={<a href="/login" onClick={() => setOpen(false)} />}
                variant="outline"
                className="mt-2 rounded-full"
              >
                Log in
              </Button>
              <Button
                render={<a href="/signup" onClick={() => setOpen(false)} />}
                className="rounded-full"
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

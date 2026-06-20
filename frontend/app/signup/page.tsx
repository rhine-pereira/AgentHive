"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Mail, Lock, User, Briefcase, Hammer, ArrowRight, Check, Loader2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

const roles = [
  {
    id: "client" as const,
    title: "Client",
    desc: "I want to post tasks and hire talent.",
    icon: Briefcase,
  },
  {
    id: "freelancer" as const,
    title: "Freelancer",
    desc: "I want to find tasks and earn money.",
    icon: Hammer,
  },
]

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<"client" | "freelancer">("client")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const email = form.get("email") as string
    const password = form.get("password") as string

    const { error: authError, data } = await signUp(email, password, { name, role })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setLoading(false)

    // If email confirmation is disabled in Supabase, we get a session immediately
    if (data?.session) {
      startTransition(() => {
        router.push(role === "client" ? "/dashboard" : "/freelancer")
      })
    } else {
      // Auto-login since our DB trigger auto-confirms the user
      const { error: loginError } = await signIn(email, password)
      if (!loginError) {
        startTransition(() => {
          router.push(role === "client" ? "/dashboard" : "/freelancer")
        })
      } else {
        // Fallback if login fails
        setSuccess(true)
      }
    }
  }

  async function handleGoogleSignup() {
    setError("")
    const { error: authError } = await signInWithGoogle(role)
    if (authError) {
      setError(authError.message)
    }
  }

  const isLoading = loading || isPending

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent you a confirmation link. Click it to activate your account."
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            A confirmation email has been sent. Please check your inbox.
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already confirmed?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join AgentHive in less than a minute."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label>I&apos;m joining as</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((r) => {
              const active = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
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
                    <r.icon className="size-4.5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" name="name" required placeholder="Jane Doe" className="pl-9" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="pl-9"
              minLength={6}
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full rounded-xl" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              Create account
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full rounded-xl"
          onClick={handleGoogleSignup}
          disabled={isLoading}
        >
          <GoogleIcon className="size-5" />
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

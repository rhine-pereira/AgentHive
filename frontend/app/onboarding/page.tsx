"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Hammer, Check, ArrowRight, Loader2 } from "lucide-react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"

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

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [role, setRole] = useState<"client" | "freelancer">("client")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleComplete() {
    setLoading(true)
    setError("")
    
    try {
      const supabase = createClient()
      
      // Update Auth Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      })
      
      if (updateError) throw updateError

      // Update Public Users Table
      if (user) {
        await supabase.from("users").update({ role }).eq("id", user.id)
      }

      router.push(role === "client" ? "/dashboard" : "/freelancer")
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to save role")
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Complete your profile"
      subtitle="Before we start, how do you plan to use AgentHive?"
    >
      <div className="flex flex-col gap-6">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((r) => {
              const active = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl border-2 p-6 text-center transition-all",
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
                      "flex size-12 items-center justify-center rounded-xl mb-4",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground shadow-sm",
                    )}
                  >
                    <r.icon className="size-6" />
                  </span>
                  <p className="text-base font-semibold text-foreground">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <Button 
          size="lg" 
          className="mt-2 w-full rounded-xl" 
          onClick={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              Continue to Dashboard
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </AuthLayout>
  )
}

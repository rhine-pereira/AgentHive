"use client"

import { useEffect, useState } from "react"
import { MapPin, Building2, BadgeCheck, Loader2 } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader, StatCard } from "@/components/app/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase"

export default function ClientProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ spent: 0, posted: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"
    
  const email = user?.email || ""

  useEffect(() => {
    async function fetchStats() {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from("tasks")
        .select("bounty_amount, status")
        .eq("poster_id", user.id)

      if (data) {
        const spent = data.reduce((sum, t) => sum + Number(t.bounty_amount || 0), 0)
        const completed = data.filter((t) => t.status === "completed" || t.status === "verified").length
        setStats({ spent, posted: data.length, completed })
      }
      setLoading(false)
    }
    fetchStats()
  }, [user])

  const hireRate = stats.posted > 0 ? Math.round((stats.completed / stats.posted) * 100) : 0

  return (
    <AppShell role="client" userName={name}>
      <PageHeader title="Profile & settings" subtitle="Manage your account and company details." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Avatar name={name} className="size-16 text-lg" />
              <div>
                <h2 className="font-heading text-xl font-semibold">{name}</h2>
                <p className="text-sm text-muted-foreground">
                  Client Account
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <BadgeCheck className="size-3.5" /> Verified
              </span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-base font-semibold">Account details</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Full name" defaultValue={name} />
              <Field label="Company" defaultValue="Independent" icon={<Building2 className="size-4" />} />
              <Field label="Email" defaultValue={email} type="email" />
              <Field label="Location" defaultValue="Global" icon={<MapPin className="size-4" />} />
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Label htmlFor="about">About your company</Label>
              <Textarea
                id="about"
                rows={4}
                defaultValue="I post automation and development tasks on AgentHive to accelerate my business operations."
              />
            </div>
            <div className="mt-5 flex justify-end">
              <Button className="rounded-xl">Save changes</Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <StatCard 
            label="Total spent" 
            value={loading ? "..." : `${stats.spent.toLocaleString()} MON`} 
            hint="all-time" 
          />
          <StatCard 
            label="Tasks posted" 
            value={loading ? "..." : String(stats.posted)} 
          />
          <StatCard 
            label="Hire rate" 
            value={loading ? "..." : `${hireRate}%`} 
            hint="tasks successfully completed" 
          />
        </div>
      </div>
    </AppShell>
  )
}

function Field({
  label,
  defaultValue,
  type = "text",
  icon,
}: {
  label: string
  defaultValue: string
  type?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <Input type={type} defaultValue={defaultValue} className={icon ? "pl-9" : undefined} />
      </div>
    </div>
  )
}

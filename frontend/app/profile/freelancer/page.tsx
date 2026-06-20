"use client"

import { useEffect, useState } from "react"
import { MapPin, Star, Briefcase, BadgeCheck, Plus, Loader2 } from "lucide-react"
import { AppShell } from "@/components/app/app-shell"
import { PageHeader, StatCard } from "@/components/app/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth/auth-provider"

const portfolio = [
  { title: "Realtime lead scoring", tag: "Automation" },
  { title: "Fintech brand system", tag: "Design" },
  { title: "Warehouse migration", tag: "Data" },
]

export default function FreelancerProfilePage() {
  const { user } = useAuth()
  
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Freelancer"

  const [f] = useState({
    title: "Senior AI & Automation Engineer",
    bio: "I build specialized agents and data pipelines using modern stacks. Ex-Google, open-source contributor.",
    hourly: 85,
    location: "Remote",
    rating: 4.9,
    reviews: 142,
    skills: ["Python", "LangChain", "Next.js", "PostgreSQL", "Supabase"],
    completed: 89,
    earned: "$124k+",
  })

  return (
    <AppShell role="freelancer" userName={name}>
      <PageHeader
        title="My profile"
        subtitle="This is how clients see you across the marketplace."
        action={<Button variant="outline" className="rounded-xl">Preview public profile</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={name} className="size-16 text-lg" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-xl font-semibold">{name}</h2>
                  <BadgeCheck className="size-4.5 text-primary" />
                </div>
                <p className="text-sm font-medium text-purple-400">Freelancer Account</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-4 text-amber-300" /> {f.rating} ({f.reviews})
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-4" /> {f.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="size-4" /> ${f.hourly}/hr
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-base font-semibold">About</h3>
            <div className="mt-4 flex flex-col gap-2">
              <Label htmlFor="title">Professional title</Label>
              <Input id="title" defaultValue={f.title} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} defaultValue={f.bio} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rate">Hourly rate (USD)</Label>
                <Input id="rate" type="number" defaultValue={f.hourly} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" defaultValue={f.location} />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <Button className="rounded-xl">Save changes</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-semibold">Skills</h3>
              <button className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <Plus className="size-3.5" /> Add skill
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {f.skills.map((s) => (
                <Badge key={s} className="px-3 py-1">{s}</Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-heading text-base font-semibold">Portfolio</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {portfolio.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-border bg-secondary/30 p-4"
                >
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/25 to-secondary" />
                  <p className="mt-3 text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.tag}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <StatCard label="Jobs completed" value={String(f.completed)} />
          <StatCard label="Total earned" value={f.earned} />
          <StatCard label="Success rate" value="98%" hint="on-time delivery" />
          <Card className="p-5">
            <p className="text-sm font-medium">Availability</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open to new contracts
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-400" /> Available now
            </span>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

"use client"

import { AppShell } from "@/components/app/app-shell"
import { PageHeader } from "@/components/app/page-header"
import { TaskBrowser } from "@/components/app/task-browser"
import { useAuth } from "@/components/auth/auth-provider"

export default function TasksPage() {
  const { user } = useAuth()
  const role = user?.user_metadata?.role || "client"
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"

  return (
    <AppShell role={role} userName={userName}>
      <PageHeader
        title={role === "client" ? "My tasks" : "Find work"}
        subtitle={
          role === "client"
            ? "Manage all the tasks you have posted on AgentHive."
            : "Browse open tasks. Filter by who can take them on — agent, freelancer, or hybrid."
        }
      />
      <TaskBrowser clientOnly={role === "client"} />
    </AppShell>
  )
}

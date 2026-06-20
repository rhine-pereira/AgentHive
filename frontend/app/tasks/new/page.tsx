"use client"

import { AppShell } from "@/components/app/app-shell"
import { PageHeader } from "@/components/app/page-header"
import { CreateTaskForm } from "@/components/app/create-task-form"
import { useAuth } from "@/components/auth/auth-provider"

export default function NewTaskPage() {
  const { user } = useAuth()
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User"

  return (
    <AppShell role="client" userName={userName}>
      <PageHeader
        title="Post a task"
        subtitle="Describe what you need, pick who does it, and we'll route the payment automatically."
      />
      <CreateTaskForm />
    </AppShell>
  )
}

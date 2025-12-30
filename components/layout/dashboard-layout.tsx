import type React from "react"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client"

export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/")
  }

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
}

"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, Sparkles, History, GitCompare, Settings, Menu, FileText, ChevronRight } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Nova Predição", href: "/predict", icon: Sparkles },
  { name: "Histórico", href: "/history", icon: History },
  { name: "Comparar", href: "/compare", icon: GitCompare },
  { name: "Documentação", href: "/docs", icon: FileText },
  { name: "Configurações", href: "/settings", icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>
              <span className="font-semibold text-sidebar-foreground">PLA Predictor</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.name}
                  {isActive && <ChevronRight className="ml-auto size-4" />}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <p className="text-xs text-muted-foreground">
              Sistema v1.0
              <br />
              Impressão 3D FDM - PLA
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile header and content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center border-b border-border px-6">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Sparkles className="size-5" />
                    </div>
                    <span className="font-semibold">PLA Predictor</span>
                  </Link>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <item.icon className="size-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <span className="font-semibold">PLA Predictor</span>
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

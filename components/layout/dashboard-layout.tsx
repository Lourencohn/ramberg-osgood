"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Sparkles,
  History,
  GitCompare,
  Settings,
  Menu,
  FileText,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft
} from "lucide-react"

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)


  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev
      localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
      return newState
    })
  }, [])

  return (
    <div className="flex min-h-screen bg-background">

      <aside
        className={cn(
          "hidden border-r border-sidebar-border bg-sidebar lg:block transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="flex h-full flex-col sticky top-0">

          <div className={cn(
            "flex h-16 items-center border-b border-sidebar-border transition-all duration-300",
            sidebarCollapsed ? "px-3 justify-center" : "px-6"
          )}>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                <Sparkles className="size-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-sidebar-foreground tracking-tight">ResistencIA</span>
                  <span className="text-[10px] text-muted-foreground font-medium">v2.0</span>
                </div>
              )}
            </Link>
          </div>


          <div className={cn(
            "flex py-3 border-b border-sidebar-border",
            sidebarCollapsed ? "justify-center px-3" : "justify-start px-4"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 hover:bg-sidebar-accent"
            >
              {sidebarCollapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
              <span className="sr-only">
                {sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              </span>
            </Button>
          </div>


          <nav className={cn(
            "flex-1 space-y-1 py-4",
            sidebarCollapsed ? "px-2" : "px-3"
          )}>
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    sidebarCollapsed && "justify-center px-0",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className={cn("size-5 flex-shrink-0", isActive && "text-primary")} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {isActive && <ChevronRight className="size-4 text-primary" />}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>


          <div className={cn(
            "border-t border-sidebar-border p-4",
            sidebarCollapsed && "px-2"
          )}>
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <div className="size-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">2.0</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-3">
                <p className="text-sm font-semibold text-foreground">ResistencIA 2.0</p>
                <p className="text-xs text-muted-foreground mt-0.5">Predição de Propriedades Mecânicas</p>
              </div>
            )}
          </div>
        </div>
      </aside>


      <div className="flex flex-1 flex-col min-w-0">

        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="size-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center border-b border-border px-6">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                      <Sparkles className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold tracking-tight">ResistencIA</span>
                      <span className="text-[10px] text-muted-foreground font-medium">v2.0</span>
                    </div>
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
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <item.icon className={cn("size-5", isActive && "text-primary")} />
                        <span className="flex-1">{item.name}</span>
                        {isActive && <ChevronRight className="size-4 text-primary" />}
                      </Link>
                    )
                  })}
                </nav>

                <div className="border-t border-border p-4">
                  <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-3">
                    <p className="text-sm font-semibold text-foreground">ResistencIA 2.0</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Predição de Propriedades Mecânicas</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <span className="font-bold tracking-tight">ResistencIA</span>
          </Link>
        </header>


        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

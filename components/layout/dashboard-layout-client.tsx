'use client'

import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { EditorialRail, RAIL_SECTIONS } from '@/components/layout/editorial-rail'
import { CommandPalette } from '@/components/layout/command-palette'
import { NavUser } from '@/components/nav-user'

type DashboardLayoutClientProps = {
  children: React.ReactNode
  user: {
    name: string
    email: string
  }
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Panorama',
  '/predict': 'Nova predição',
  '/import': 'Importar ensaios',
  '/history': 'Histórico',
  '/compare': 'Comparar ensaios',
  '/atlas': 'Atlas paramétrico',
  '/mef': 'MEF e Ramberg',
  '/calibracao': 'Calibração',
  '/verificacao': 'Verificação de malha',
  '/test-live': 'Ensaio ao vivo',
  '/docs': 'Documentação',
  '/settings': 'Configurações',
}

function useCurrentLabel() {
  const pathname = usePathname()
  return useMemo(() => {
    const match = Object.keys(ROUTE_LABELS).find(
      (key) => pathname === key || pathname.startsWith(`${key}/`)
    )
    return match ? ROUTE_LABELS[match] : 'ResistencIA'
  }, [pathname])
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const currentLabel = useCurrentLabel()
  const pathname = usePathname()

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  // ⌘K / Ctrl+K opens the palette
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const openPalette = useCallback(() => setPaletteOpen(true), [])

  return (
    <div className="flex min-h-svh w-full bg-background text-foreground">
      <EditorialRail user={user} />

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <TopBar
          currentLabel={currentLabel}
          onOpenPalette={openPalette}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      {/* Mobile drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="flex flex-row items-center justify-between border-b border-foreground/10 px-5 py-4">
            <SheetTitle className="flex items-center gap-2 font-display text-lg italic">
              <Image src="/logo.png" alt="ResistencIA" width={26} height={26} />
              ResistencIA
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 overflow-y-auto p-3">
            {RAIL_SECTIONS.map((section) => (
              <div key={section.label} className="space-y-1 py-1">
                <p className="label-caps px-3 pb-1 pt-2">{section.label}</p>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-copper-soft text-copper-deep'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
          <div className="border-t border-foreground/10 p-3">
            <NavUser user={user} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

type TopBarProps = {
  currentLabel: string
  onOpenPalette: () => void
  onOpenMobileNav: () => void
}

function TopBar({ currentLabel, onOpenPalette, onOpenMobileNav }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-foreground/15 bg-background/85 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileNav}
        aria-label="Abrir navegação"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex min-w-0 items-center gap-2">
        <span className="label-caps-copper hidden sm:inline">ResistencIA</span>
        <span className="hidden h-3 w-px bg-foreground/20 sm:inline-block" />
        <span className="font-display truncate text-lg italic">{currentLabel}</span>
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className="ml-auto flex h-9 items-center gap-2 rounded-md border border-foreground/15 bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Buscar ou navegar</span>
        <kbd className="ml-auto hidden h-5 select-none items-center gap-0.5 rounded border border-foreground/15 bg-background px-1.5 font-mono-data text-[10px] tabular-nums text-muted-foreground sm:inline-flex">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </button>
    </header>
  )
}

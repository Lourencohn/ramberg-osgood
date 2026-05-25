'use client'

import type React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  GitCompare,
  History,
  Home,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { NavUser } from '@/components/nav-user'

export type RailItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export type RailSection = {
  label: string
  items: RailItem[]
}

export const RAIL_SECTIONS: RailSection[] = [
  {
    label: 'Visão',
    items: [{ href: '/dashboard', label: 'Panorama', icon: Home }],
  },
  {
    label: 'Criar',
    items: [
      { href: '/predict', label: 'Nova predição', icon: Sparkles },
      { href: '/import', label: 'Importar ensaios', icon: UploadCloud },
    ],
  },
  {
    label: 'Consultar',
    items: [
      { href: '/history', label: 'Histórico', icon: History },
      { href: '/compare', label: 'Comparar ensaios', icon: GitCompare },
      { href: '/atlas', label: 'Atlas paramétrico', icon: BarChart3 },
    ],
  },
  {
    label: 'Análise',
    items: [
      { href: '/mef', label: 'MEF e Ramberg', icon: Layers },
      { href: '/calibracao', label: 'Calibração', icon: Target },
      { href: '/verificacao', label: 'Verificação de malha', icon: ShieldCheck },
      { href: '/test-live', label: 'Ensaio ao vivo', icon: Activity },
    ],
  },
  {
    label: 'Referência',
    items: [{ href: '/docs', label: 'Documentação', icon: BookOpen }],
  },
]

type EditorialRailProps = {
  user: { name: string; email: string; avatar?: string | null }
}

export function EditorialRail({ user }: EditorialRailProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="sticky top-0 z-30 hidden h-svh w-16 shrink-0 flex-col border-r border-foreground/15 bg-sidebar md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-foreground/10">
          <Link
            href="/dashboard"
            className="flex size-9 items-center justify-center rounded-md border border-foreground/10 bg-background transition-colors hover:border-copper"
          >
            <Image src="/logo.png" alt="ResistencIA" width={26} height={26} />
            <span className="sr-only">ResistencIA</span>
          </Link>
        </div>

        {/* Nav, scrolls internally only if needed */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="flex flex-col items-center gap-1">
            {RAIL_SECTIONS.map((section, index) => (
              <li key={section.label} className="flex w-full flex-col items-center gap-1">
                {index > 0 ? (
                  <span className="my-1 h-px w-6 bg-foreground/10" aria-hidden="true" />
                ) : null}
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const Icon = item.icon
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={`group relative flex size-10 items-center justify-center rounded-md transition-colors ${
                            isActive
                              ? 'bg-copper-soft text-copper-deep'
                              : 'text-foreground/65 hover:bg-muted hover:text-foreground'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {isActive ? (
                            <span
                              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-copper"
                              aria-hidden="true"
                            />
                          ) : null}
                          <Icon className="size-4" />
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-display text-sm italic">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer: user avatar */}
        <div className="flex flex-col items-center gap-2 border-t border-foreground/10 p-2">
          <NavUser user={user} compact />
        </div>
      </aside>
    </TooltipProvider>
  )
}

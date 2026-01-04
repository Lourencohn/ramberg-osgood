'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText,
  GitCompare,
  History,
  Home,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'

import { NavUser } from '@/components/nav-user'
import { Label } from '@/components/ui/label'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useSettings } from '@/components/settings-provider'
import { formatDataSource } from '@/lib/formatters'
import { convertSpeed, convertTemperature, getUnitLabels } from '@/lib/units'

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
  }
}

type SearchResult = {
  id: number
  testNumber: number
  testCode: string | null
  createdAt: string
  source: string | null
  profileCode: string
  temperature: number
  speed: number
}

const navigation = [
  {
    title: 'Fluxos',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: Home },
      { title: 'Nova Predição', href: '/predict', icon: Sparkles },
      { title: 'Histórico', href: '/history', icon: History },
      { title: 'Importar', href: '/import', icon: UploadCloud },
      { title: 'Comparar', href: '/compare', icon: GitCompare },
    ],
  },
  {
    title: 'Conteúdo',
    items: [{ title: 'Documentação', href: '/docs', icon: FileText }],
  },
  {
    title: 'Ajustes',
    items: [{ title: 'Configurações', href: '/settings', icon: Settings }],
  },
]

function SearchForm({ ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()
  const { settings } = useSettings()
  const unitLabels = getUnitLabels(settings.unitSystem)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const navItems = useMemo(
    () =>
      navigation.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          group: group.title,
        }))
      ),
    []
  )

  const navMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return navItems.filter(
      (item) =>
        item.title.toLowerCase().includes(normalized) ||
        item.group.toLowerCase().includes(normalized)
    )
  }, [navItems, query])

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        const payload = await response.json()
        setResults(Array.isArray(payload.results) ? payload.results : [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [query])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/history?query=${encodeURIComponent(trimmed)}`)
    setOpen(false)
  }

  const handleSelect = () => {
    setOpen(false)
  }

  const hasQuery = query.trim().length > 0

  return (
    <form onSubmit={handleSubmit} {...props}>
      <div ref={containerRef}>
        <SidebarGroup className="py-0">
          <SidebarGroupContent className="relative">
          <Label htmlFor="sidebar-search" className="sr-only">
            Buscar
          </Label>
          <SidebarInput
            id="sidebar-search"
            placeholder="Buscar na plataforma..."
            className="pl-8"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setOpen(false)
              }
            }}
          />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
          {open && hasQuery ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-border bg-background shadow-md">
              <div className="max-h-72 overflow-auto p-2 space-y-3">
                {navMatches.length ? (
                  <div>
                    <p className="px-2 py-1 text-[11px] text-muted-foreground uppercase tracking-wide">
                      Navegação
                    </p>
                    <SidebarMenu>
                      {navMatches.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild size="sm" onClick={handleSelect}>
                            <Link href={item.href}>
                              <item.icon className="size-3.5" />
                              <span>{item.title}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground">
                                {item.group}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                ) : null}

                <div>
                  <p className="px-2 py-1 text-[11px] text-muted-foreground uppercase tracking-wide">
                    Ensaios
                  </p>
                  {loading ? (
                    <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Buscando...
                    </div>
                  ) : results.length ? (
                    <SidebarMenu>
                      {results.map((result) => {
                        const tempValue =
                          convertTemperature(result.temperature, settings.unitSystem) ??
                          result.temperature
                        const speedValue =
                          convertSpeed(result.speed, settings.unitSystem) ?? result.speed
                        return (
                          <SidebarMenuItem key={result.id}>
                            <SidebarMenuButton asChild size="sm" onClick={handleSelect}>
                              <Link href={`/history?view=${result.id}`}>
                                <FileSpreadsheet className="size-3.5" />
                                <span>Ensaio {result.testNumber}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground">
                                  {formatDataSource(result.source) ?? result.source ?? ''}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                            <div className="px-8 pb-2 text-[11px] text-muted-foreground">
                              {tempValue !== null
                                ? `${tempValue.toFixed(0)}${unitLabels.temperature}`
                                : '--'}
                              {' · '}
                              {speedValue !== null
                                ? `${speedValue.toFixed(0)} ${unitLabels.speed}`
                                : '--'}
                            </div>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  ) : (
                    <div className="px-2 py-2 text-xs text-muted-foreground">
                      Nenhum ensaio encontrado.
                    </div>
                  )}
                </div>

                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const trimmed = query.trim()
                        if (!trimmed) return
                        router.push(`/history?query=${encodeURIComponent(trimmed)}`)
                        handleSelect()
                      }}
                    >
                      <Search className="size-3.5" />
                      <span>Pesquisar "{query}" no Histórico</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            </div>
          ) : null}
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </form>
  )
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-16"
            >
              <Link href="/dashboard">
                <div className="bg-white text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-lg">
                  <Image src="/logo.png" alt="ResistencIA" width={40} height={40} />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-sm font-semibold">ResistencIA</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Predição de Propriedades Mecânicas
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

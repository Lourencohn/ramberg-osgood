'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, ChevronRight, FileSpreadsheet, Loader2, Search } from 'lucide-react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { useSettings } from '@/components/settings-provider'
import { formatDataSource, formatProfileTokens } from '@/lib/formatters'
import { convertSpeed, convertTemperature, getUnitLabels } from '@/lib/units'
import { logoutAction } from '@/lib/auth-actions'
import { RAIL_SECTIONS } from '@/components/layout/editorial-rail'

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

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { settings } = useSettings()
  const unitLabels = getUnitLabels(settings.unitSystem)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setLoading(false)
    }
  }, [open])

  // Debounced server search for ensaios
  useEffect(() => {
    if (!open) return
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
        if ((error as Error).name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [open, query])

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router]
  )

  const handleSearchAll = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    onOpenChange(false)
    router.push(`/history?query=${encodeURIComponent(trimmed)}`)
  }, [onOpenChange, query, router])

  const handleLogout = useCallback(async () => {
    onOpenChange(false)
    const formData = new FormData()
    await logoutAction(formData)
  }, [onOpenChange])

  const ensaiosLabel = useMemo(() => {
    if (query.trim().length < 2) return 'Ensaios'
    if (loading) return 'Buscando ensaios'
    return `Ensaios (${results.length})`
  }, [loading, query, results.length])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar ensaios, perfis, comandos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query.trim().length < 2
            ? 'Comece a digitar para buscar ensaios e comandos.'
            : loading
              ? 'Buscando...'
              : 'Nada encontrado por aqui.'}
        </CommandEmpty>

        {RAIL_SECTIONS.map((section) => (
          <CommandGroup key={section.label} heading={section.label}>
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.href}
                  value={`${section.label} ${item.label}`}
                  onSelect={() => handleSelect(item.href)}
                >
                  <Icon className="text-foreground/60" />
                  <span>{item.label}</span>
                  <ChevronRight className="ml-auto size-3.5 text-foreground/30" />
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}

        {query.trim().length >= 2 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading={ensaiosLabel}>
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Procurando no banco de ensaios.
                </div>
              ) : results.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground">
                  Nenhum ensaio corresponde a "{query}".
                </div>
              ) : (
                results.map((result) => {
                  const tempValue =
                    convertTemperature(result.temperature, settings.unitSystem) ?? result.temperature
                  const speedValue =
                    convertSpeed(result.speed, settings.unitSystem) ?? result.speed
                  const tokens = formatProfileTokens({
                    material: result.profileCode,
                    temperature: result.temperature,
                    speed: result.speed,
                  })
                  return (
                    <CommandItem
                      key={result.id}
                      value={`ensaio ${result.testNumber} ${result.profileCode}`}
                      onSelect={() => handleSelect(`/history?view=${result.id}`)}
                    >
                      <FileSpreadsheet className="text-foreground/60" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display italic">
                            Ensaio {String(result.testNumber).padStart(2, '0')}
                          </span>
                          {formatDataSource(result.source) ? (
                            <span className="label-caps text-foreground/50">
                              {formatDataSource(result.source)}
                            </span>
                          ) : null}
                        </div>
                        <p className="font-mono-data text-[11px] text-muted-foreground">
                          {tokens.material} ·{' '}
                          {tempValue !== null
                            ? `${tempValue.toFixed(0)}${unitLabels.temperature}`
                            : 'sem temp.'}{' '}
                          · {speedValue !== null
                            ? `${speedValue.toFixed(0)} ${unitLabels.speed}`
                            : 'sem vel.'}
                        </p>
                      </div>
                      <ChevronRight className="ml-auto size-3.5 text-foreground/30" />
                    </CommandItem>
                  )
                })
              )}
              <CommandItem value="abrir-historico" onSelect={handleSearchAll}>
                <Search className="text-foreground/60" />
                Pesquisar "{query}" no histórico completo
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Conta">
          <CommandItem value="configuracoes" onSelect={() => handleSelect('/settings')}>
            <Settings className="text-foreground/60" />
            Configurações
          </CommandItem>
          <CommandItem value="sair" onSelect={handleLogout}>
            <LogOut className="text-foreground/60" />
            Sair da conta
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { ProfileDetail } from '@/lib/dashboard-data'
import { formatProfileTokens } from '@/lib/formatters'

type ProfileMatrixProps = {
  profiles: ProfileDetail[]
}

type SortKey = 'temperature' | 'speed' | 'tests' | 'stress' | 'strain'
type SortDir = 'asc' | 'desc'

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const TEMPERATURE_COLOR_STOPS: Array<{ max: number; color: string }> = [
  { max: 195, color: 'var(--chart-1)' },
  { max: 205, color: 'var(--chart-2)' },
  { max: 215, color: 'var(--chart-3)' },
  { max: 225, color: 'var(--chart-4)' },
  { max: 999, color: 'var(--chart-5)' },
]

function temperatureColor(temperature: number) {
  return TEMPERATURE_COLOR_STOPS.find((stop) => temperature <= stop.max)?.color ?? 'var(--chart-5)'
}

type ProfileSummary = {
  profile: ProfileDetail
  avgStress: number | null
  avgStrain: number | null
  bestPoints: { strain: number; stress: number }[]
}

function summarize(profiles: ProfileDetail[]): ProfileSummary[] {
  return profiles.map((profile) => {
    const stressVals = profile.tests
      .map((t) => t.maxStress)
      .filter((v): v is number => v !== null && Number.isFinite(v))
    const strainVals = profile.tests
      .map((t) => t.maxStrain)
      .filter((v): v is number => v !== null && Number.isFinite(v))
    const best = [...profile.tests]
      .filter((test) => test.points.length > 0)
      .sort((a, b) => (b.maxStress ?? 0) - (a.maxStress ?? 0))[0]

    return {
      profile,
      avgStress: stressVals.length ? stressVals.reduce((a, b) => a + b, 0) / stressVals.length : null,
      avgStrain: strainVals.length ? strainVals.reduce((a, b) => a + b, 0) / strainVals.length : null,
      bestPoints: best?.points ?? [],
    }
  })
}

export function ProfileMatrix({ profiles }: ProfileMatrixProps) {
  const [sortKey, setSortKey] = useState<SortKey>('temperature')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const rows = useMemo(() => {
    const summarized = summarize(profiles)
    const direction = sortDir === 'asc' ? 1 : -1
    return summarized.sort((a, b) => {
      const va =
        sortKey === 'temperature'
          ? a.profile.temperature
          : sortKey === 'speed'
            ? a.profile.speed
            : sortKey === 'tests'
              ? a.profile.tests.length
              : sortKey === 'stress'
                ? a.avgStress ?? -Infinity
                : a.avgStrain ?? -Infinity
      const vb =
        sortKey === 'temperature'
          ? b.profile.temperature
          : sortKey === 'speed'
            ? b.profile.speed
            : sortKey === 'tests'
              ? b.profile.tests.length
              : sortKey === 'stress'
                ? b.avgStress ?? -Infinity
                : b.avgStrain ?? -Infinity
      return (va - vb) * direction
    })
  }, [profiles, sortDir, sortKey])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'stress' || key === 'strain' || key === 'tests' ? 'desc' : 'asc')
    }
  }

  const totalTests = profiles.reduce((sum, profile) => sum + profile.tests.length, 0)

  return (
    <article className="rounded-md border border-foreground/15 bg-card">
      {/* Editorial header strip */}
      <div className="flex flex-col gap-2 border-b border-foreground/10 px-5 py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="label-caps-copper">Tábua I</span>
          <h2 className="mt-1 font-display text-2xl leading-tight tracking-tight">
            Matriz de <span className="italic">perfis</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {profiles.length.toString().padStart(2, '0')} perfis ·{' '}
            {totalTests.toString().padStart(2, '0')} ensaios. Clique para expandir.
          </p>
        </div>
        <p className="font-mono-data text-[10px] uppercase tracking-widest text-muted-foreground">
          ordenado por{' '}
          <span className="text-copper-deep">
            {sortKey === 'temperature'
              ? 'temperatura'
              : sortKey === 'speed'
                ? 'velocidade'
                : sortKey === 'tests'
                  ? 'nº ensaios'
                  : sortKey === 'stress'
                    ? 'σ médio'
                    : 'ε médio'}
          </span>{' '}
          ({sortDir === 'asc' ? '↑' : '↓'})
        </p>
      </div>

      {/* Header row */}
      <div className="hidden grid-cols-[1.7fr_0.9fr_0.9fr_0.7fr_0.9fr_0.9fr_1.1fr_36px] items-center gap-3 border-b border-foreground/10 bg-muted/40 px-5 py-2.5 lg:grid">
        <span className="label-caps">Perfil</span>
        <SortHeader label="Temp." active={sortKey === 'temperature'} dir={sortDir} onClick={() => toggleSort('temperature')} />
        <SortHeader label="Vel." active={sortKey === 'speed'} dir={sortDir} onClick={() => toggleSort('speed')} />
        <SortHeader label="Ensaios" active={sortKey === 'tests'} dir={sortDir} onClick={() => toggleSort('tests')} />
        <SortHeader label="σ médio" active={sortKey === 'stress'} dir={sortDir} onClick={() => toggleSort('stress')} />
        <SortHeader label="ε médio" active={sortKey === 'strain'} dir={sortDir} onClick={() => toggleSort('strain')} />
        <span className="label-caps text-right">Curva σ x ε</span>
        <span aria-hidden="true" />
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="flex items-center justify-center px-5 py-12 text-sm italic text-muted-foreground">
          Nenhum perfil cadastrado ainda.
        </div>
      ) : (
        <ul className="divide-y divide-foreground/8">
          {rows.map((row) => {
            const tokens = formatProfileTokens({
              material: row.profile.material,
              temperature: row.profile.temperature,
              speed: row.profile.speed,
            })
            const isExpanded = expandedKey === row.profile.profile
            const accentColor = temperatureColor(row.profile.temperature)

            return (
              <li key={row.profile.profile}>
                <button
                  type="button"
                  onClick={() => setExpandedKey((current) => (current === row.profile.profile ? null : row.profile.profile))}
                  className="group grid w-full grid-cols-[1fr_36px] items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/40 lg:grid-cols-[1.7fr_0.9fr_0.9fr_0.7fr_0.9fr_0.9fr_1.1fr_36px]"
                >
                  {/* Profile cell */}
                  <div className="flex items-center gap-3">
                    {/* Temperature color indicator */}
                    <span
                      className="h-9 w-1 rounded-full"
                      style={{ backgroundColor: accentColor }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-lg italic">{tokens.material}</span>
                        {tokens.variant ? (
                          <span className="label-caps text-foreground/60">{tokens.variant}</span>
                        ) : null}
                      </div>
                      <p className="font-mono-data text-[11px] text-muted-foreground">
                        {row.profile.profile}
                      </p>
                    </div>
                  </div>

                  {/* Mobile readout: pills */}
                  <div className="contents lg:hidden">
                    <div className="col-span-2 mt-2 flex flex-wrap items-center gap-2">
                      <Pill>{tokens.temperature ?? 'sem dados'}</Pill>
                      <Pill>{tokens.speed ?? 'sem dados'}</Pill>
                      <Pill mono>
                        {row.profile.tests.length} ensaio
                        {row.profile.tests.length > 1 ? 's' : ''}
                      </Pill>
                      <span className="ml-auto font-mono-data text-xs">
                        σ̄{' '}
                        <span className="text-foreground">
                          {row.avgStress !== null ? stressFormatter.format(row.avgStress) : 'sem dados'}{' '}
                          <span className="text-muted-foreground">MPa</span>
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Desktop columns */}
                  <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                    {tokens.temperature ?? 'sem dados'}
                  </span>
                  <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                    {tokens.speed ?? 'sem dados'}
                  </span>
                  <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                    {row.profile.tests.length.toString().padStart(2, '0')}
                  </span>
                  <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                    {row.avgStress !== null ? (
                      <>
                        {stressFormatter.format(row.avgStress)}
                        <span className="text-muted-foreground"> MPa</span>
                      </>
                    ) : (
                      'sem dados'
                    )}
                  </span>
                  <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                    {row.avgStrain !== null ? strainFormatter.format(row.avgStrain) : 'sem dados'}
                  </span>

                  {/* Sparkline */}
                  <div className="hidden h-9 w-full lg:block">
                    {row.bestPoints.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={row.bestPoints}>
                          <Line
                            type="monotone"
                            dataKey="stress"
                            stroke={accentColor}
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="block h-px w-full translate-y-4 bg-foreground/15" />
                    )}
                  </div>

                  {/* Chevron */}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-foreground/40 transition-all group-hover:border-foreground/15 group-hover:text-foreground">
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </span>
                </button>

                {/* Expanded panel */}
                {isExpanded ? (
                  <div className="border-t border-foreground/10 bg-muted/30 px-5 py-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="label-caps">Ensaios deste perfil</span>
                      <Link
                        href={`/history?query=${encodeURIComponent(row.profile.profile)}`}
                        className="text-[11px] font-medium uppercase tracking-wider text-copper-deep underline-offset-4 hover:underline"
                      >
                        ver no histórico →
                      </Link>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {row.profile.tests.map((test) => (
                        <li
                          key={test.id}
                          className="rounded-md border border-foreground/10 bg-card p-3"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-mono-data text-sm">
                              Ensaio {test.testNumber.toString().padStart(2, '0')}
                            </span>
                            <span className="label-caps">{test.pointCount} pts</span>
                          </div>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="font-display text-2xl leading-none">
                              {test.maxStress !== null ? stressFormatter.format(test.maxStress) : 'sem dados'}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              MPa
                            </span>
                          </div>
                          <p className="mt-1 font-mono-data text-[11px] text-muted-foreground">
                            ε máx{' '}
                            {test.maxStrain !== null ? strainFormatter.format(test.maxStrain) : 'sem dados'}
                          </p>
                          {test.points.length > 0 ? (
                            <div className="mt-2 h-10 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={test.points}>
                                  <Line
                                    type="monotone"
                                    dataKey="stress"
                                    stroke={accentColor}
                                    strokeWidth={1.5}
                                    dot={false}
                                    isAnimationActive={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex items-center gap-1 text-left transition-colors ${
        active ? 'text-copper-deep' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <span className="label-caps">{label}</span>
      <Icon className="h-3 w-3" />
    </button>
  )
}

function Pill({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-foreground/15 bg-background px-2 py-0.5 text-[11px] ${
        mono ? 'font-mono-data' : ''
      }`}
    >
      {children}
    </span>
  )
}

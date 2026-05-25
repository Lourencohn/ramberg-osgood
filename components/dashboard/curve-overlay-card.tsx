'use client'

import { useMemo, useState } from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import type { ProfileDetail } from '@/lib/dashboard-data'
import { formatProfileTokens } from '@/lib/formatters'

type CurveOverlayCardProps = {
  profiles: ProfileDetail[]
}

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

type OverlaySeries = {
  key: string
  label: string
  shortLabel: string
  color: string
  temperature: number
  speed: number
  maxStress: number
  points: { strain: number; stress: number }[]
}

function buildOverlayData(series: OverlaySeries[]) {
  const map = new Map<number, { strain: number } & Record<string, number | null>>()
  for (const item of series) {
    for (const point of item.points) {
      const strain = Number(point.strain.toFixed(4))
      const entry = map.get(strain) ?? { strain }
      entry[item.key] = point.stress
      map.set(strain, entry)
    }
  }
  return Array.from(map.values()).sort((a, b) => a.strain - b.strain)
}

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

export function CurveOverlayCard({ profiles }: CurveOverlayCardProps) {
  const series: OverlaySeries[] = useMemo(() => {
    return profiles
      .map((profile) => {
        const best = [...profile.tests]
          .filter((test) => test.points.length > 0)
          .sort((a, b) => (b.maxStress ?? 0) - (a.maxStress ?? 0))[0]
        if (!best) return null
        const tokens = formatProfileTokens({
          material: profile.material,
          temperature: profile.temperature,
          speed: profile.speed,
        })
        const shortLabel = [tokens.temperature, tokens.speed].filter(Boolean).join(' · ')
        return {
          key: profile.profile,
          label: profile.label,
          shortLabel: shortLabel || profile.profile,
          color: temperatureColor(profile.temperature),
          temperature: profile.temperature,
          speed: profile.speed,
          maxStress: best.maxStress ?? 0,
          points: best.points,
        }
      })
      .filter(Boolean) as OverlaySeries[]
  }, [profiles])

  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const overlayData = useMemo(() => buildOverlayData(series), [series])

  const chartConfig = useMemo(() => {
    return series.reduce(
      (acc, item) => {
        acc[item.key] = { label: item.shortLabel, color: item.color }
        return acc
      },
      {} as Record<string, { label: string; color: string }>
    )
  }, [series])

  const summary = useMemo(() => {
    if (!series.length) return null
    const maxStress = Math.max(...series.map((s) => s.maxStress))
    const allStrains = series.flatMap((s) => s.points.map((p) => p.strain))
    const maxStrain = allStrains.length ? Math.max(...allStrains) : 0
    return { maxStress, maxStrain, count: series.length }
  }, [series])

  if (!series.length) {
    return (
      <article className="relative flex h-full flex-col rounded-md border border-foreground/15 bg-card p-6">
        <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
          <span className="label-caps-copper">Figura 01</span>
          <span className="label-caps">Curva σ x ε</span>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="font-display text-lg italic text-muted-foreground">
            Aguardando o primeiro ensaio.
          </p>
        </div>
      </article>
    )
  }

  return (
    <article className="corner-brackets relative flex h-full flex-col rounded-md border border-foreground/15 bg-card p-5">
      {/* Editorial chart header */}
      <div className="flex items-start justify-between gap-3 border-b border-foreground/10 pb-4">
        <div>
          <span className="label-caps-copper">Figura 01</span>
          <h2 className="mt-1 font-display text-3xl leading-tight tracking-tight">
            Curva <span className="italic">tensão por deformação</span>
          </h2>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            Sobreposição do ensaio de maior σ por perfil de impressão. As cores acompanham a
            temperatura, do azul mais frio ao cobre mais quente.
          </p>
        </div>
        {summary ? (
          <dl className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-right">
            <dt className="label-caps">σ pico</dt>
            <dd className="font-mono-data text-sm">{stressFormatter.format(summary.maxStress)} MPa</dd>
            <dt className="label-caps">ε máx</dt>
            <dd className="font-mono-data text-sm">{strainFormatter.format(summary.maxStrain)}</dd>
            <dt className="label-caps">perfis</dt>
            <dd className="font-mono-data text-sm">{summary.count.toString().padStart(2, '0')}</dd>
          </dl>
        ) : null}
      </div>

      {/* The chart */}
      <div className="relative mt-4 flex-1">
        {/* Axis micro-labels editorial style */}
        <span className="label-caps absolute -left-1 top-0 -rotate-90 origin-top-left translate-y-6 text-foreground/50">
          σ (MPa) →
        </span>

        <ChartContainer config={chartConfig} className="h-[300px] w-full aspect-auto">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overlayData} margin={{ top: 8, right: 12, bottom: 0, left: 28 }}>
              <defs>
                <pattern
                  id="grid-grain"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="0.6" fill="currentColor" className="text-foreground/8" />
                </pattern>
              </defs>
              <CartesianGrid
                strokeDasharray="0"
                stroke="currentColor"
                className="text-foreground/8"
                horizontal
                vertical={false}
              />
              <XAxis
                dataKey="strain"
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke="currentColor"
                className="text-[10px] text-foreground/60"
                tick={{ fontFamily: 'var(--font-mono-app)' }}
                tickFormatter={(value: number) => value.toFixed(3)}
              />
              <YAxis
                stroke="currentColor"
                className="text-[10px] text-foreground/60"
                tick={{ fontFamily: 'var(--font-mono-app)' }}
                tickFormatter={(value: number) => value.toFixed(0)}
                width={32}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--copper)', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={<ChartTooltipContent indicator="line" />}
              />
              {series.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={hidden.has(item.key) ? 0 : 1.6}
                  strokeOpacity={hidden.has(item.key) ? 0 : 0.92}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <span className="label-caps absolute -bottom-2 right-2 text-foreground/50">
          ε (mm/mm) →
        </span>
      </div>

      {/* Legend as filter toggles, click to isolate */}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-foreground/10 pt-3 sm:grid-cols-3 lg:grid-cols-4">
        {series.map((item) => {
          const isHidden = hidden.has(item.key)
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => {
                setHidden((prev) => {
                  const next = new Set(prev)
                  if (next.has(item.key)) next.delete(item.key)
                  else next.add(item.key)
                  return next
                })
              }}
              className={`group flex items-center gap-2 text-left transition-opacity ${
                isHidden ? 'opacity-35' : 'opacity-100'
              }`}
            >
              <span
                className="h-[3px] w-5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="font-mono-data text-[11px] leading-tight">
                {item.shortLabel}
              </span>
            </button>
          )
        })}
      </div>
    </article>
  )
}

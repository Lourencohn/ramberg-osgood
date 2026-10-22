'use client'

import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import type { ExperimentalPrediction, ExperimentalRun, StressStrainPoint } from '@/types'
import type { UnitSystem } from '@/lib/settings'
import { convertStress, getUnitLabels } from '@/lib/units'
import { cn } from '@/lib/utils'

type PredictionCurvesChartProps = {
  modelCurve: StressStrainPoint[]
  experimental: ExperimentalPrediction | null
  runs: ExperimentalRun[]
  runsLabel: string
  unitSystem?: UnitSystem
  interactive?: boolean
  className?: string
}

type ChartRow = {
  strain: number
  model?: number
  expected?: number
  deviation?: number
  band?: [number, number]
} & Partial<Record<`run${number}`, number>>

const MODEL_COLOR = 'var(--chart-1)'
const EXPECTED_COLOR = 'var(--chart-4)'
const RUN_COLOR = 'var(--muted-foreground)'

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function interpolate<T extends StressStrainPoint>(
  curve: T[],
  strain: number,
  read: (point: T) => number
): number | undefined {
  if (curve.length < 2) return undefined
  if (strain < curve[0].strain || strain > curve[curve.length - 1].strain) return undefined
  let index = 1
  while (index < curve.length - 1 && curve[index].strain < strain) index += 1
  const previous = curve[index - 1]
  const current = curve[index]
  const span = current.strain - previous.strain
  const t = span > 0 ? (strain - previous.strain) / span : 1
  return read(previous) + t * (read(current) - read(previous))
}

function axisTicks(max: number, targetCount = 10): number[] {
  if (!(max > 0)) return [0]
  const rawStep = max / targetCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rawStep)!
  const count = Math.ceil(max / step - 1e-9)
  return Array.from({ length: count + 1 }, (_, index) => Number((index * step).toPrecision(12)))
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch}
      <span>{label}</span>
    </span>
  )
}

function CurvesTooltip({
  active,
  payload,
  stressUnit,
}: TooltipProps<number, string> & { stressUnit: string }) {
  const row = payload?.[0]?.payload as ChartRow | undefined
  if (!active || !row || (row.model === undefined && row.expected === undefined)) return null
  return (
    <div className="grid min-w-44 gap-1 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Deformação</span>
        <span className="font-mono font-semibold">{strainFormatter.format(row.strain)}</span>
      </div>
      {row.expected !== undefined ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-0.5 w-3" style={{ background: EXPECTED_COLOR }} />
            Experimental esperada
          </span>
          <span className="font-mono font-semibold">
            {stressFormatter.format(row.expected)}
            {row.deviation !== undefined ? ` ± ${stressFormatter.format(row.deviation)}` : ''}{' '}
            {stressUnit}
          </span>
        </div>
      ) : null}
      {row.model !== undefined ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3 border-t-2 border-dashed" style={{ borderColor: MODEL_COLOR }} />
            Ramberg-Osgood
          </span>
          <span className="font-mono font-semibold">
            {stressFormatter.format(row.model)} {stressUnit}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export function PredictionCurvesChart({
  modelCurve,
  experimental,
  runs,
  runsLabel,
  unitSystem = 'si',
  interactive = true,
  className,
}: PredictionCurvesChartProps) {
  const unitLabels = getUnitLabels(unitSystem)

  const { rows, rupture, xTicks } = useMemo(() => {
    const toStress = (value: number) => convertStress(value, unitSystem) ?? value
    const expectedCurve = experimental?.curve ?? []
    const runRows: ChartRow[] = runs.flatMap((run, index) =>
      run.points.map((point) => ({ strain: point.strain, [`run${index}`]: toStress(point.stress) }))
    )
    const baseRows: ChartRow[] = [...modelCurve, ...expectedCurve].map((point) => ({
      strain: point.strain,
    }))

    const rowsByStrain = new Map<number, ChartRow>()
    for (const row of [...baseRows, ...runRows]) {
      rowsByStrain.set(row.strain, { ...rowsByStrain.get(row.strain), ...row })
    }

    const rows = [...rowsByStrain.values()]
      .sort((a, b) => a.strain - b.strain)
      .map((row) => {
        const model = interpolate(modelCurve, row.strain, (point) => point.stress)
        const expected = interpolate(expectedCurve, row.strain, (point) => point.stress)
        const deviation = interpolate(expectedCurve, row.strain, (point) => point.deviation)
        const hasBand = expected !== undefined && deviation !== undefined
        return {
          ...row,
          model: model === undefined ? undefined : toStress(model),
          expected: expected === undefined ? undefined : toStress(expected),
          deviation: deviation === undefined ? undefined : toStress(deviation),
          band: hasBand
            ? ([toStress(Math.max(0, expected - deviation)), toStress(expected + deviation)] as [
                number,
                number,
              ])
            : undefined,
        }
      })

    const rupture = experimental
      ? {
          strain: experimental.peakStrain.mean,
          stress: toStress(experimental.ultimateStress.mean),
          strainError: experimental.peakStrain.deviation,
          stressError: toStress(experimental.ultimateStress.deviation),
        }
      : null

    const xMax = Math.max(
      0,
      ...rows.map((row) => row.strain),
      rupture ? rupture.strain + rupture.strainError : 0
    )

    return { rows, rupture, xTicks: axisTicks(xMax) }
  }, [modelCurve, experimental, runs, unitSystem])

  if (!modelCurve.length) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border-2 border-dashed border-border',
          className
        )}
      >
        <p className="text-muted-foreground">
          Gere uma previsão para ver as curvas de tensão por deformação.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {experimental ? (
          <LegendItem
            swatch={
              <span
                className="flex h-3 w-5 items-center"
                style={{ background: `color-mix(in oklab, ${EXPECTED_COLOR} 18%, transparent)` }}
              >
                <span className="h-0.5 w-full" style={{ background: EXPECTED_COLOR }} />
              </span>
            }
            label="Experimental esperada ± 1 desvio-padrão"
          />
        ) : null}
        <LegendItem
          swatch={
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: MODEL_COLOR }} />
          }
          label="Ramberg-Osgood"
        />
        {runs.length ? (
          <LegendItem
            swatch={<span className="h-px w-5 opacity-60" style={{ background: RUN_COLOR }} />}
            label={runsLabel}
          />
        ) : null}
        {experimental ? (
          <LegendItem
            swatch={
              <span
                className="size-2.5 rounded-full border-2 border-background"
                style={{ background: EXPECTED_COLOR, boxShadow: `0 0 0 1px ${EXPECTED_COLOR}` }}
              />
            }
            label="Ruptura esperada"
          />
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1">
        <ChartContainer config={{}} className="absolute inset-0 aspect-auto">
          <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="strain"
              domain={[0, xTicks[xTicks.length - 1]]}
              ticks={xTicks}
              tickFormatter={(value) => strainFormatter.format(value)}
              label={{
                value: `Deformação (${unitLabels.strain})`,
                position: 'insideBottom',
                offset: -10,
                className: 'fill-muted-foreground text-xs',
              }}
            />
            <YAxis
              type="number"
              domain={[0, 'auto']}
              tickFormatter={(value) => stressFormatter.format(value)}
              label={{
                value: `Tensão (${unitLabels.stress})`,
                angle: -90,
                position: 'insideLeft',
                className: 'fill-muted-foreground text-xs',
              }}
            />
            {interactive ? (
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={<CurvesTooltip stressUnit={unitLabels.stress} />}
              />
            ) : null}
            <Area
              dataKey="band"
              stroke="none"
              fill={EXPECTED_COLOR}
              fillOpacity={0.16}
              connectNulls
              isAnimationActive={false}
              activeDot={false}
            />
            {runs.map((run, index) => (
              <Line
                key={run.specimen}
                dataKey={`run${index}`}
                stroke={RUN_COLOR}
                strokeOpacity={0.45}
                strokeWidth={1}
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
            <Line
              dataKey="model"
              stroke={MODEL_COLOR}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              dataKey="expected"
              stroke={EXPECTED_COLOR}
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            {rupture ? (
              <>
                <ReferenceLine
                  segment={[
                    { x: rupture.strain - rupture.strainError, y: rupture.stress },
                    { x: rupture.strain + rupture.strainError, y: rupture.stress },
                  ]}
                  stroke={EXPECTED_COLOR}
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                />
                <ReferenceLine
                  segment={[
                    { x: rupture.strain, y: rupture.stress - rupture.stressError },
                    { x: rupture.strain, y: rupture.stress + rupture.stressError },
                  ]}
                  stroke={EXPECTED_COLOR}
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                />
                <ReferenceDot
                  x={rupture.strain}
                  y={rupture.stress}
                  r={5}
                  fill={EXPECTED_COLOR}
                  stroke="var(--background)"
                  strokeWidth={2}
                  ifOverflow="extendDomain"
                />
              </>
            ) : null}
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
}

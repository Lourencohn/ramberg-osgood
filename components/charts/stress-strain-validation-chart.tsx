'use client'

import { useMemo } from 'react'
import type { StressStrainPoint } from '@/types'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'
import type { UnitSystem } from '@/lib/settings'
import { convertStress, getUnitLabels } from '@/lib/units'

type StressStrainValidationChartProps = {
  curve: StressStrainPoint[]
  points: StressStrainPoint[]
  unitSystem?: UnitSystem
  interactive?: boolean
}

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function StressStrainValidationChart({
  curve,
  points,
  unitSystem = 'si',
  interactive = true,
}: StressStrainValidationChartProps) {
  const unitLabels = getUnitLabels(unitSystem)
  const displayCurve = useMemo(
    () =>
      curve.map((point) => ({
        ...point,
        stress: convertStress(point.stress, unitSystem) ?? point.stress,
      })),
    [curve, unitSystem]
  )
  const displayPoints = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        stress: convertStress(point.stress, unitSystem) ?? point.stress,
      })),
    [points, unitSystem]
  )

  if (!displayPoints.length || !displayCurve.length) {
    return (
      <div className="h-[340px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Sem pontos reais suficientes para validação.</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        predicted: {
          label: 'Curva prevista',
          color: 'var(--chart-1)',
        },
        measured: {
          label: 'Pontos reais',
          color: 'var(--chart-3)',
        },
      }}
      className="h-[340px] w-full aspect-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayCurve}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="strain"
            tickFormatter={(value) => strainFormatter.format(value)}
            className="text-xs"
            name={`Deformacao (${unitLabels.strain})`}
          />
          <YAxis
            tickFormatter={(value) => stressFormatter.format(value)}
            className="text-xs"
            name={`Tensao (${unitLabels.stress})`}
          />
          {interactive ? <ChartTooltip content={<ChartTooltipContent />} /> : null}
          <Legend />
          <Line
            type="monotone"
            dataKey="stress"
            name="Curva prevista"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            data={displayPoints}
            dataKey="stress"
            name="Pontos reais"
            stroke="transparent"
            dot={{
              r: 2,
              fill: 'var(--chart-3)',
              stroke: 'var(--chart-3)',
              strokeWidth: 1,
            }}
            activeDot={{
              r: 3,
              fill: 'var(--chart-3)',
              stroke: 'var(--chart-3)',
              strokeWidth: 1,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

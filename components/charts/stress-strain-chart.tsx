'use client'

import { useMemo } from 'react'
import type { StressStrainPoint } from '@/types'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import type { UnitSystem } from '@/lib/settings'
import { convertStress, getUnitLabels } from '@/lib/units'

type StressStrainChartProps = {
  curve: StressStrainPoint[]
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

export function StressStrainChart({
  curve,
  unitSystem = 'si',
  interactive = true,
}: StressStrainChartProps) {
  const unitLabels = getUnitLabels(unitSystem)
  const displayCurve = useMemo(
    () =>
      curve.map((point) => ({
        ...point,
        stress: convertStress(point.stress, unitSystem) ?? point.stress,
      })),
    [curve, unitSystem]
  )

  if (!displayCurve.length) {
    return (
      <div className="h-80 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Insira parametros para gerar a curva tensao x deformacao.
        </p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        stress: {
          label: `Tensao (${unitLabels.stress})`,
          color: 'var(--chart-1)',
        },
      }}
      className="h-80 w-full aspect-auto"
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
          {interactive ? (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, payload) => {
                    const entry = payload && !Array.isArray(payload) ? payload.payload : undefined
                    if (!entry) return value as number
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Deformacao</span>
                          <span className="font-mono font-semibold">
                            {strainFormatter.format(entry.strain)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Tensao</span>
                          <span className="font-mono font-semibold">
                            {stressFormatter.format(entry.stress)} {unitLabels.stress}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />
              }
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="stress"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

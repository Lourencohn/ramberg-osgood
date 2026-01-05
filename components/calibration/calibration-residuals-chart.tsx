'use client'

import type { UnitSystem } from '@/lib/settings'
import { getUnitLabels } from '@/lib/units'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

type ResidualPoint = {
  strain: number
  residual: number
}

type CalibrationResidualsChartProps = {
  data: ResidualPoint[]
  unitSystem?: UnitSystem
  interactive?: boolean
}

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const residualFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 5,
  maximumFractionDigits: 5,
})

export function CalibrationResidualsChart({
  data,
  unitSystem = 'si',
  interactive = true,
}: CalibrationResidualsChartProps) {
  const unitLabels = getUnitLabels(unitSystem)

  if (!data.length) {
    return (
      <div className="h-72 flex items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">Sem resíduos disponíveis.</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        residual: {
          label: 'Resíduo',
          color: 'var(--chart-2)',
        },
      }}
      className="h-72 w-full aspect-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="strain"
            tickFormatter={(value) => strainFormatter.format(value)}
            className="text-xs"
            name={`Deformacao (${unitLabels.strain})`}
          />
          <YAxis
            tickFormatter={(value) => residualFormatter.format(value)}
            className="text-xs"
            name={`Resíduo (${unitLabels.strain})`}
          />
          <ReferenceLine y={0} stroke="var(--color-residual)" strokeDasharray="4 4" />
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
                          <span className="text-muted-foreground">Resíduo</span>
                          <span className="font-mono font-semibold">
                            {residualFormatter.format(entry.residual)}
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
            dataKey="residual"
            stroke="var(--color-residual)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

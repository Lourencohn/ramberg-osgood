'use client'

import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from 'recharts'

export type CorrelationPoint = {
  x: number
  y: number
  label: string
  color: string
}

type ParameterCorrelationChartProps = {
  points: CorrelationPoint[]
  xLabel: string
  yLabel: string
  xFormatter?: (value: number) => string
  yFormatter?: (value: number) => string
}

export function ParameterCorrelationChart({
  points,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter,
}: ParameterCorrelationChartProps) {
  if (!points.length) {
    return (
      <div className="h-72 flex items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">Sem dados para correlação.</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        point: {
          label: 'Perfil',
          color: 'var(--chart-2)',
        },
      }}
      className="h-72 w-full aspect-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="x"
            className="text-xs"
            name={xLabel}
            tickFormatter={(value) => (xFormatter ? xFormatter(value) : `${value}`)}
          />
          <YAxis
            dataKey="y"
            className="text-xs"
            name={yLabel}
            tickFormatter={(value) => (yFormatter ? yFormatter(value) : `${value}`)}
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const entry = payload[0]?.payload as CorrelationPoint | undefined
              if (!entry) return null
              return (
                <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                  <div className="font-medium">{entry.label}</div>
                  <div className="grid gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{xLabel}</span>
                      <span className="font-mono font-semibold">
                        {xFormatter ? xFormatter(entry.x) : entry.x.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{yLabel}</span>
                      <span className="font-mono font-semibold">
                        {yFormatter ? yFormatter(entry.y) : entry.y.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          <Scatter
            data={points}
            shape={(props) => {
              const { cx, cy, payload } = props
              if (cx === undefined || cy === undefined) return null
              return <circle cx={cx} cy={cy} r={4} fill={payload.color} />
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

"use client"

import type { StressStrainPoint } from "@/types"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

type StressStrainChartProps = {
  curve: StressStrainPoint[]
}

const strainFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const stressFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function StressStrainChart({ curve }: StressStrainChartProps) {
  if (!curve.length) {
    return (
      <div className="h-80 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Insira parâmetros para gerar a curva σ-ε</p>
      </div>
    )
  }

  return (
    <ChartContainer
      config={{
        stress: {
          label: "σ (MPa)",
          color: "var(--chart-1)",
        },
      }}
      className="h-80 w-full aspect-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={curve}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="strain"
            tickFormatter={(value) => strainFormatter.format(value)}
            className="text-xs"
            name="ε"
          />
          <YAxis
            tickFormatter={(value) => stressFormatter.format(value)}
            className="text-xs"
            name="σ"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, payload) => {
                  const entry = payload && !Array.isArray(payload) ? payload.payload : undefined
                  if (!entry) return value as number
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">ε</span>
                        <span className="font-mono font-semibold">
                          {strainFormatter.format(entry.strain)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">σ</span>
                        <span className="font-mono font-semibold">
                          {stressFormatter.format(entry.stress)} MPa
                        </span>
                      </div>
                    </div>
                  )
                }}
              />
            }
          />
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

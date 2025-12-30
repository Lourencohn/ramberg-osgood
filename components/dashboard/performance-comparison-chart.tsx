"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { SpeedPerformance } from "@/lib/dashboard-data"
import { useMemo } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"

type PerformanceComparisonChartProps = {
  performance: SpeedPerformance
}

export function PerformanceComparisonChart({ performance }: PerformanceComparisonChartProps) {
  const config = useMemo(
    () =>
      performance.series.reduce(
        (acc, temperature, index) => {
          acc[`t${temperature}`] = {
            label: `${temperature}°C`,
            color: `var(--chart-${(index % 5) + 1})`,
          }
          return acc
        },
        {} as Record<string, { label: string; color: string }>,
      ),
    [performance.series],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Velocidade × tensão máxima</CardTitle>
        <CardDescription>Tensão máxima média (MPa) por velocidade, separada por temperatura</CardDescription>
      </CardHeader>
      <CardContent>
        {performance.data.length === 0 || performance.series.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há dados suficientes para comparar velocidades.</p>
        ) : (
          <ChartContainer config={config} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="speed" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {performance.series.map((temperature, index) => {
                  const key = `t${temperature}`
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={`var(--chart-${(index % 5) + 1})`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name={`${temperature}°C`}
                      connectNulls
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

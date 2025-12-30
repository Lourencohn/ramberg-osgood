"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { ProfileAverages } from "@/lib/dashboard-data"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

type SimulationsTrendChartProps = {
  data: ProfileAverages[]
}

export function SimulationsTrendChart({ data }: SimulationsTrendChartProps) {
  const chartData = data
    .filter((item) => item.avgMaxStress !== null)
    .map((item) => ({
      profile: item.profile,
      avgStress: Number(item.avgMaxStress?.toFixed(2)),
      temperature: item.temperature,
      speed: item.speed,
      tests: item.tests,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tensão média por perfil</CardTitle>
        <CardDescription>Tensão máxima média dos ensaios reais por combinação de temperatura e velocidade</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma curva com tensão calculada foi encontrada.</p>
        ) : (
          <ChartContainer
            config={{
              avgStress: {
                label: "Tensão média (MPa)",
                color: "var(--chart-1)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="profile" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, payload) => {
                        const entry = payload && !Array.isArray(payload) ? payload.payload : undefined
                        return (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Tensão média</span>
                              <span className="font-mono font-semibold">{value as number} MPa</span>
                            </div>
                            {entry ? (
                              <div className="text-xs text-muted-foreground">
                                {entry.temperature}°C / {entry.speed}mm/s · {entry.tests} ensaios
                              </div>
                            ) : null}
                          </>
                        )
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="avgStress"
                  stroke="var(--chart-1)"
                  fill="url(#colorStress)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

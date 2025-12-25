"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jul", simulations: 12, avgStrength: 51.2 },
  { month: "Ago", simulations: 18, avgStrength: 52.1 },
  { month: "Set", simulations: 15, avgStrength: 50.8 },
  { month: "Out", simulations: 22, avgStrength: 52.5 },
  { month: "Nov", simulations: 28, avgStrength: 51.9 },
  { month: "Dez", simulations: 35, avgStrength: 53.2 },
  { month: "Jan", simulations: 42, avgStrength: 52.7 },
]

export function SimulationsTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Simulações</CardTitle>
        <CardDescription>Número de simulações realizadas nos últimos 7 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            simulations: {
              label: "Simulações",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSimulations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="simulations"
                stroke="hsl(var(--chart-1))"
                fill="url(#colorSimulations)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

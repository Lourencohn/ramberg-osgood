"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"

const data = [
  { speed: 30, strength: 55.2, modulus: 3650, elongation: 4.8 },
  { speed: 35, strength: 54.1, modulus: 3580, elongation: 4.6 },
  { speed: 40, strength: 52.8, modulus: 3490, elongation: 4.4 },
  { speed: 45, strength: 51.2, modulus: 3380, elongation: 4.2 },
  { speed: 50, strength: 49.5, modulus: 3250, elongation: 3.9 },
  { speed: 55, strength: 47.6, modulus: 3120, elongation: 3.7 },
  { speed: 60, strength: 45.8, modulus: 2980, elongation: 3.5 },
]

export function PerformanceComparisonChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relação Velocidade × Propriedades</CardTitle>
        <CardDescription>Impacto da velocidade de impressão nas propriedades mecânicas (210°C)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            strength: {
              label: "Resistência (MPa)",
              color: "hsl(var(--chart-1))",
            },
            modulus: {
              label: "Módulo (MPa/100)",
              color: "hsl(var(--chart-2))",
            },
            elongation: {
              label: "Alongamento (%)",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="speed"
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="strength"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Resistência"
              />
              <Line
                type="monotone"
                dataKey={(entry) => entry.modulus / 100}
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Módulo/100"
              />
              <Line
                type="monotone"
                dataKey="elongation"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Alongamento"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

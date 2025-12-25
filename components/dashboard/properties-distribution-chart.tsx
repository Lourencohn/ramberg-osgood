"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"

const data = [
  { range: "45-48", tensile: 8, modulus: 12 },
  { range: "48-51", tensile: 22, modulus: 28 },
  { range: "51-54", tensile: 45, modulus: 38 },
  { range: "54-57", tensile: 28, modulus: 25 },
  { range: "57-60", tensile: 12, modulus: 8 },
]

export function PropertiesDistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Propriedades</CardTitle>
        <CardDescription>Frequência de resultados por faixa de valores (MPa)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            tensile: {
              label: "Resistência à Tração",
              color: "hsl(var(--chart-2))",
            },
            modulus: {
              label: "Módulo de Young",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="range" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="tensile" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Resistência" />
              <Bar dataKey="modulus" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Módulo" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

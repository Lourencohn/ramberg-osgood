"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"

const data = [
  { name: "200-205°C", value: 28, color: "hsl(var(--chart-1))" },
  { name: "205-210°C", value: 42, color: "hsl(var(--chart-2))" },
  { name: "210-215°C", value: 35, color: "hsl(var(--chart-3))" },
  { name: "215-220°C", value: 25, color: "hsl(var(--chart-4))" },
  { name: "220-225°C", value: 17, color: "hsl(var(--chart-5))" },
]

export function ParametersUsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faixas de Temperatura Utilizadas</CardTitle>
        <CardDescription>Distribuição dos parâmetros de temperatura nas simulações</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Simulações",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

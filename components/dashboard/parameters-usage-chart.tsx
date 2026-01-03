'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { TemperatureUsage } from '@/lib/dashboard-data'
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts'

type ParametersUsageChartProps = {
  data: TemperatureUsage[]
}

export function ParametersUsageChart({ data }: ParametersUsageChartProps) {
  const chartData = data.map((item, index) => ({
    name: `${item.temperature}°C`,
    value: item.tests,
    color: `var(--chart-${(index % 5) + 1})`,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por temperatura</CardTitle>
        <CardDescription>Ensaios reais agrupados por temperatura de impressão</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum ensaio encontrado.</p>
        ) : (
          <ChartContainer
            config={{
              value: {
                label: 'Ensaios',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

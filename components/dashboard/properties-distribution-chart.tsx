"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { StressHistogramBin } from "@/lib/dashboard-data"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts"

type PropertiesDistributionChartProps = {
  data: StressHistogramBin[]
}

export function PropertiesDistributionChart({ data }: PropertiesDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição da tensão máxima</CardTitle>
        <CardDescription>Frequência dos ensaios reais por faixas de tensão máxima (MPa)</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum valor de tensão calculada para exibir.</p>
        ) : (
          <ChartContainer
            config={{
              count: {
                label: "Ensaios",
                color: "var(--chart-2)",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Ensaios" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

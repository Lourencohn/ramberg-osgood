'use client'

import { useMemo } from 'react'
import type { StressStrainPoint } from '@/types'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'
import type { UnitSystem } from '@/lib/settings'
import { convertStress, getUnitLabels } from '@/lib/units'

type LinearizationPoint = {
  logStress: number
  logPlasticStrain: number
}

type RambergOsgoodLinearizationChartProps = {
  points: StressStrainPoint[]
  unitSystem?: UnitSystem
  interactive?: boolean
}

const axisFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function estimateElasticModulus(points: StressStrainPoint[]) {
  const smallStrain = points.filter((point) => point.strain > 0 && point.strain <= 0.0025)
  const base = smallStrain.length >= 5 ? smallStrain : points.slice(0, Math.min(12, points.length))
  const ratios = base
    .map((point) => point.stress / point.strain)
    .filter((value) => Number.isFinite(value) && value > 0)
  if (!ratios.length) return null
  return ratios.reduce((sum, value) => sum + value, 0) / ratios.length
}

function toLog(value: number) {
  return Math.log10(value)
}

export function RambergOsgoodLinearizationChart({
  points,
  unitSystem = 'si',
  interactive = true,
}: RambergOsgoodLinearizationChartProps) {
  const unitLabels = getUnitLabels(unitSystem)
  const { actualPoints, linePoints, xDomain, yDomain, r2, estimatedE } = useMemo(() => {
    if (!points.length) {
      return {
        actualPoints: [] as LinearizationPoint[],
        linePoints: [] as LinearizationPoint[],
        xDomain: null,
        yDomain: null,
        r2: null,
        estimatedE: null,
      }
    }

    const scaled = points.map((point) => ({
      ...point,
      stress: convertStress(point.stress, unitSystem) ?? point.stress,
    }))
    const sorted = [...scaled].sort((a, b) => a.strain - b.strain)
    const estimatedE = estimateElasticModulus(sorted)
    if (!estimatedE) {
      return {
        actualPoints: [] as LinearizationPoint[],
        linePoints: [] as LinearizationPoint[],
        xDomain: null,
        yDomain: null,
        r2: null,
        estimatedE: null,
      }
    }

    const actual = sorted
      .map((point) => {
        if (point.stress <= 0 || point.strain <= 0) return null
        const plasticStrain = point.strain - point.stress / estimatedE
        if (plasticStrain <= 0) return null
        return {
          logStress: toLog(point.stress),
          logPlasticStrain: toLog(plasticStrain),
        }
      })
      .filter(Boolean) as LinearizationPoint[]

    if (actual.length < 8) {
      return {
        actualPoints: [],
        linePoints: [],
        xDomain: null,
        yDomain: null,
        r2: null,
        estimatedE,
      }
    }

    const sumX = actual.reduce((sum, point) => sum + point.logStress, 0)
    const sumY = actual.reduce((sum, point) => sum + point.logPlasticStrain, 0)
    const sumXX = actual.reduce((sum, point) => sum + point.logStress * point.logStress, 0)
    const sumXY = actual.reduce((sum, point) => sum + point.logStress * point.logPlasticStrain, 0)
    const count = actual.length
    const denominator = count * sumXX - sumX * sumX
    if (!denominator) {
      return {
        actualPoints: [],
        linePoints: [],
        xDomain: null,
        yDomain: null,
        r2: null,
        estimatedE,
      }
    }

    const slope = (count * sumXY - sumX * sumY) / denominator
    const intercept = (sumY - slope * sumX) / count

    const stresses = actual.map((point) => point.logStress)
    const minLog = Math.min(...stresses)
    const maxLog = Math.max(...stresses)
    const steps = 40
    const line: LinearizationPoint[] = []

    for (let i = 0; i <= steps; i += 1) {
      const logStress = minLog + ((maxLog - minLog) * i) / steps
      line.push({
        logStress,
        logPlasticStrain: intercept + slope * logStress,
      })
    }

    const meanY = sumY / count
    const ssTot = actual.reduce(
      (sum, point) => sum + Math.pow(point.logPlasticStrain - meanY, 2),
      0
    )
    const ssRes = actual.reduce(
      (sum, point) =>
        sum + Math.pow(point.logPlasticStrain - (intercept + slope * point.logStress), 2),
      0
    )
    const r2 = ssTot ? 1 - ssRes / ssTot : null

    const xValues = [...actual, ...line].map((point) => point.logStress)
    const yValues = [...actual, ...line].map((point) => point.logPlasticStrain)
    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...yValues)
    const yMax = Math.max(...yValues)
    const xPad = Math.max(0.08, (xMax - xMin) * 0.12)
    const yPad = Math.max(0.08, (yMax - yMin) * 0.12)

    return {
      actualPoints: actual,
      linePoints: line,
      xDomain: [xMin - xPad, xMax + xPad] as [number, number],
      yDomain: [yMin - yPad, yMax + yPad] as [number, number],
      r2,
      estimatedE,
    }
  }, [points, unitSystem])

  if (!actualPoints.length) {
    return (
      <div className="h-72 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Sem dados suficientes para linearização.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Reta ajustada por regressao linear (log-log)</span>
        {r2 !== null ? <span>• R²: {r2.toFixed(3)}</span> : null}
        {estimatedE !== null ? (
          <span>
            • E estimado: {Math.round(estimatedE)} {unitLabels.stress}
          </span>
        ) : null}
      </div>
      <ChartContainer
        config={{
          linear: {
            label: 'Reta ajustada',
            color: 'var(--chart-2)',
          },
          points: {
            label: 'Pontos reais',
            color: 'var(--chart-4)',
          },
        }}
        className="h-72 w-full aspect-auto"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={linePoints} margin={{ top: 8, right: 18, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="logStress"
              domain={xDomain ?? undefined}
              padding={{ left: 6, right: 6 }}
              tickFormatter={(value) => axisFormatter.format(value)}
              className="text-xs"
              name={`log tensao (${unitLabels.stress})`}
            />
            <YAxis
              type="number"
              dataKey="logPlasticStrain"
              domain={yDomain ?? undefined}
              tickFormatter={(value) => axisFormatter.format(value)}
              className="text-xs"
              name="log deformacao plastica"
            />
            {interactive ? (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, payload) => {
                      const entry = payload && !Array.isArray(payload) ? payload.payload : undefined
                      if (!entry) return value as number
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">log tensao</span>
                            <span className="font-mono font-semibold">
                              {axisFormatter.format(entry.logStress)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">log deformacao plastica</span>
                            <span className="font-mono font-semibold">
                              {axisFormatter.format(entry.logPlasticStrain)}
                            </span>
                          </div>
                        </div>
                      )
                    }}
                  />
                }
              />
            ) : null}
            <Legend />
            <Line
              type="linear"
              dataKey="logPlasticStrain"
              name="Reta ajustada"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              data={actualPoints}
              dataKey="logPlasticStrain"
              name="Pontos reais"
              stroke="transparent"
              dot={{
                r: 2,
                fill: 'var(--chart-4)',
                stroke: 'var(--chart-4)',
                strokeWidth: 1,
              }}
              activeDot={{
                r: 3,
                fill: 'var(--chart-4)',
                stroke: 'var(--chart-4)',
                strokeWidth: 1,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

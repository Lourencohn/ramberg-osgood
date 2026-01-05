'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RambergOsgoodTrainingPoint } from '@/types'
import { calculateMechanicalProperties } from '@/lib/mechanical-properties'
import {
  convertEnergyDensity,
  convertSpeed,
  convertStress,
  convertTemperature,
  getUnitLabels,
} from '@/lib/units'
import { useSettings } from '@/components/settings-provider'
import { ParameterCorrelationChart } from '@/components/atlas/parameter-correlation-chart'
import { ParameterSpaceChart, type ParameterSpacePoint } from '@/components/atlas/parameter-space-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Layers, SlidersHorizontal } from 'lucide-react'

type MaterialAtlasClientProps = {
  trainingData: RambergOsgoodTrainingPoint[]
}

type MetricKey =
  | 'E'
  | 'sigma_0'
  | 'n'
  | 'maxStrain'
  | 'rmse'
  | 'pointsUsed'
  | 'yieldStress'
  | 'ultimateStress'
  | 'ductility'
  | 'resilience'
  | 'toughness'

type AtlasPoint = RambergOsgoodTrainingPoint & {
  id: string
  yieldStress: number
  ultimateStress: number
  ductility: number
  resilience: number
  toughness: number
}

type MetricOption = {
  key: MetricKey
  label: string
  unit?: string
  format: (value: number) => string
}

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const energyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const countFormatter = new Intl.NumberFormat('pt-BR')

const makeProfileKey = (point: RambergOsgoodTrainingPoint) =>
  `${point.profile}__${point.temperature}__${point.speed}`

const colorFromValue = (value: number) => {
  const hue = (0.6 - 0.55 * value) * 360
  return `hsl(${hue}, 60%, 50%)`
}

const parseNumber = (value: string) => {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function MaterialAtlasClient({ trainingData }: MaterialAtlasClientProps) {
  const { settings } = useSettings()
  const unitLabels = getUnitLabels(settings.unitSystem)

  const atlasData = useMemo<AtlasPoint[]>(() => {
    return trainingData.map((point) => {
      const properties = calculateMechanicalProperties(
        {
          E: point.E,
          sigma_0: point.sigma_0,
          n: point.n,
        },
        point.maxStrain
      )
      return {
        ...point,
        ...properties,
        id: makeProfileKey(point),
      }
    })
  }, [trainingData])

  const metrics = useMemo<MetricOption[]>(() => {
    return [
      {
        key: 'E',
        label: 'E (Módulo de Young)',
        unit: unitLabels.stress,
        format: (value) => stressFormatter.format(value),
      },
      {
        key: 'sigma_0',
        label: 'σ₀ (referência)',
        unit: unitLabels.stress,
        format: (value) => stressFormatter.format(value),
      },
      {
        key: 'n',
        label: 'n (encruamento)',
        format: (value) => value.toFixed(2),
      },
      {
        key: 'maxStrain',
        label: 'εmax',
        unit: unitLabels.strain,
        format: (value) => strainFormatter.format(value),
      },
      {
        key: 'rmse',
        label: 'RMSE (ajuste)',
        unit: unitLabels.strain,
        format: (value) => strainFormatter.format(value),
      },
      {
        key: 'pointsUsed',
        label: 'Pontos usados',
        format: (value) => countFormatter.format(value),
      },
      {
        key: 'yieldStress',
        label: 'σy (escoamento)',
        unit: unitLabels.stress,
        format: (value) => stressFormatter.format(value),
      },
      {
        key: 'ultimateStress',
        label: 'σUTS (máxima)',
        unit: unitLabels.stress,
        format: (value) => stressFormatter.format(value),
      },
      {
        key: 'ductility',
        label: 'Ductilidade',
        unit: '%',
        format: (value) => value.toFixed(2),
      },
      {
        key: 'resilience',
        label: 'Resiliência',
        unit: unitLabels.energy,
        format: (value) => energyFormatter.format(value),
      },
      {
        key: 'toughness',
        label: 'Tenacidade',
        unit: unitLabels.energy,
        format: (value) => energyFormatter.format(value),
      },
    ]
  }, [unitLabels.energy, unitLabels.strain, unitLabels.stress])

  const metricMap = useMemo(() => {
    return new Map(metrics.map((metric) => [metric.key, metric]))
  }, [metrics])

  const valueForMetric = (point: AtlasPoint, key: MetricKey) => {
    switch (key) {
      case 'E':
        return convertStress(point.E, settings.unitSystem) ?? point.E
      case 'sigma_0':
        return convertStress(point.sigma_0, settings.unitSystem) ?? point.sigma_0
      case 'yieldStress':
        return convertStress(point.yieldStress, settings.unitSystem) ?? point.yieldStress
      case 'ultimateStress':
        return convertStress(point.ultimateStress, settings.unitSystem) ?? point.ultimateStress
      case 'resilience':
        return convertEnergyDensity(point.resilience, settings.unitSystem) ?? point.resilience
      case 'toughness':
        return convertEnergyDensity(point.toughness, settings.unitSystem) ?? point.toughness
      case 'ductility':
        return point.ductility
      case 'maxStrain':
        return point.maxStrain
      case 'rmse':
        return point.rmse
      case 'pointsUsed':
        return point.pointsUsed
      case 'n':
        return point.n
      default:
        return 0
    }
  }

  const [axisState, setAxisState] = useState({
    x: 'E' as MetricKey,
    y: 'sigma_0' as MetricKey,
    z: 'n' as MetricKey,
    color: 'rmse' as MetricKey,
  })

  const [filters, setFilters] = useState({
    tempMin: '',
    tempMax: '',
    speedMin: '',
    speedMax: '',
  })

  const filteredData = useMemo(() => {
    const tempMin = parseNumber(filters.tempMin)
    const tempMax = parseNumber(filters.tempMax)
    const speedMin = parseNumber(filters.speedMin)
    const speedMax = parseNumber(filters.speedMax)

    return atlasData.filter((point) => {
      const temperature = convertTemperature(point.temperature, settings.unitSystem) ?? point.temperature
      const speed = convertSpeed(point.speed, settings.unitSystem) ?? point.speed

      if (tempMin !== null && temperature < tempMin) return false
      if (tempMax !== null && temperature > tempMax) return false
      if (speedMin !== null && speed < speedMin) return false
      if (speedMax !== null && speed > speedMax) return false
      return true
    })
  }, [atlasData, filters, settings.unitSystem])

  const options = useMemo(() => {
    return filteredData.map((point) => {
      const temperature = convertTemperature(point.temperature, settings.unitSystem) ?? point.temperature
      const speed = convertSpeed(point.speed, settings.unitSystem) ?? point.speed
      return {
        id: point.id,
        label: `${point.profile} • ${temperature.toFixed(0)}${unitLabels.temperature} • ${speed.toFixed(
          0
        )} ${unitLabels.speed}`,
      }
    })
  }, [filteredData, settings.unitSystem, unitLabels.speed, unitLabels.temperature])

  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '')

  useEffect(() => {
    if (!options.length) return
    if (!options.find((option) => option.id === selectedId)) {
      setSelectedId(options[0]?.id ?? '')
    }
  }, [options, selectedId])

  const selected = useMemo(() => {
    if (!filteredData.length) return null
    return filteredData.find((point) => point.id === selectedId) ?? filteredData[0]
  }, [filteredData, selectedId])

  const chartPoints = useMemo<ParameterSpacePoint[]>(() => {
    return filteredData
      .map((point) => {
        const x = valueForMetric(point, axisState.x)
        const y = valueForMetric(point, axisState.y)
        const z = valueForMetric(point, axisState.z)
        const colorValue = valueForMetric(point, axisState.color)
        if (![x, y, z, colorValue].every((value) => Number.isFinite(value))) {
          return null
        }
        const temperature = convertTemperature(point.temperature, settings.unitSystem) ?? point.temperature
        const speed = convertSpeed(point.speed, settings.unitSystem) ?? point.speed
        return {
          id: point.id,
          label: `${point.profile} (${temperature.toFixed(0)}${unitLabels.temperature}, ${speed.toFixed(
            0
          )} ${unitLabels.speed})`,
          x,
          y,
          z,
          colorValue,
        }
      })
      .filter(Boolean) as ParameterSpacePoint[]
  }, [axisState, filteredData, settings.unitSystem, unitLabels.speed, unitLabels.temperature])

  const correlationPoints = useMemo(() => {
    if (!chartPoints.length) return []
    const colorValues = chartPoints.map((point) => point.colorValue)
    const colorMin = Math.min(...colorValues)
    const colorMax = Math.max(...colorValues)
    const range = colorMax - colorMin || 1

    return chartPoints.map((point) => ({
      x: point.x,
      y: point.y,
      label: point.label,
      color: colorFromValue((point.colorValue - colorMin) / range),
    }))
  }, [chartPoints])

  const summary = useMemo(() => {
    if (!filteredData.length) {
      return {
        total: 0,
        tempRange: '--',
        speedRange: '--',
        rmseMedian: '--',
      }
    }
    const temps = filteredData.map(
      (point) => convertTemperature(point.temperature, settings.unitSystem) ?? point.temperature
    )
    const speeds = filteredData.map(
      (point) => convertSpeed(point.speed, settings.unitSystem) ?? point.speed
    )
    const rmse = filteredData.map((point) => point.rmse).sort((a, b) => a - b)
    const mid = Math.floor(rmse.length / 2)
    const rmseMedian = rmse.length % 2 ? rmse[mid] : (rmse[mid - 1] + rmse[mid]) / 2

    return {
      total: filteredData.length,
      tempRange: `${Math.min(...temps).toFixed(0)} - ${Math.max(...temps).toFixed(0)} ${
        unitLabels.temperature
      }`,
      speedRange: `${Math.min(...speeds).toFixed(0)} - ${Math.max(...speeds).toFixed(0)} ${
        unitLabels.speed
      }`,
      rmseMedian: strainFormatter.format(rmseMedian),
    }
  }, [filteredData, settings.unitSystem, unitLabels.speed, unitLabels.temperature])

  const tempTokens = summary.tempRange === '--' ? [] : summary.tempRange.split(' ')
  const speedTokens = summary.speedRange === '--' ? [] : summary.speedRange.split(' ')
  const tempMinHint = tempTokens[0] ?? ''
  const tempMaxHint = tempTokens[2] ?? ''
  const speedMinHint = speedTokens[0] ?? ''
  const speedMaxHint = speedTokens[2] ?? ''

  const ranking = useMemo(() => {
    const bestFit = [...filteredData].sort((a, b) => a.rmse - b.rmse).slice(0, 5)
    const topToughness = [...filteredData].sort((a, b) => b.toughness - a.toughness).slice(0, 5)
    return { bestFit, topToughness }
  }, [filteredData])

  const axisMeta = {
    x: metricMap.get(axisState.x) ?? metrics[0],
    y: metricMap.get(axisState.y) ?? metrics[0],
    z: metricMap.get(axisState.z) ?? metrics[0],
    color: metricMap.get(axisState.color) ?? metrics[0],
  }

  if (!trainingData.length) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Sem dados de atlas</CardTitle>
          <CardDescription>
            Importe ensaios para visualizar a distribuição de parâmetros.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          O atlas 3D utiliza perfis calibrados para mapear regiões de E, σ₀ e n. Assim que os
          ensaios estiverem no banco, o mapa é liberado automaticamente.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:h-[calc(100svh-220px)] lg:items-stretch lg:overflow-hidden">
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <SlidersHorizontal className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Controle do atlas</CardTitle>
              <CardDescription>Eixos, filtros e destaque do perfil</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <Tabs defaultValue="filters" className="space-y-3">
            <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
              <TabsTrigger value="filters" className="py-2.5">
                Filtros
              </TabsTrigger>
              <TabsTrigger value="summary" className="py-2.5">
                Resumo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Eixo X
                  </p>
                  <Select
                    value={axisState.x}
                    onValueChange={(value) =>
                      setAxisState((current) => ({ ...current, x: value as MetricKey }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione X" />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Eixo Y
                  </p>
                  <Select
                    value={axisState.y}
                    onValueChange={(value) =>
                      setAxisState((current) => ({ ...current, y: value as MetricKey }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione Y" />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Eixo Z
                  </p>
                  <Select
                    value={axisState.z}
                    onValueChange={(value) =>
                      setAxisState((current) => ({ ...current, z: value as MetricKey }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione Z" />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Cor
                  </p>
                  <Select
                    value={axisState.color}
                    onValueChange={(value) =>
                      setAxisState((current) => ({ ...current, color: value as MetricKey }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione cor" />
                    </SelectTrigger>
                    <SelectContent>
                      {metrics.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                <p className="text-sm font-semibold text-foreground">Filtro por processo</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Temperatura min</p>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      value={filters.tempMin}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, tempMin: event.target.value }))
                      }
                      placeholder={tempMinHint ? `Ex: ${tempMinHint}` : 'Ex: 190'}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Temperatura max</p>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      value={filters.tempMax}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, tempMax: event.target.value }))
                      }
                      placeholder={tempMaxHint ? `Ex: ${tempMaxHint}` : 'Ex: 230'}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Velocidade min</p>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      value={filters.speedMin}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, speedMin: event.target.value }))
                      }
                      placeholder={speedMinHint ? `Ex: ${speedMinHint}` : 'Ex: 20'}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Velocidade max</p>
                    <input
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      value={filters.speedMax}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, speedMax: event.target.value }))
                      }
                      placeholder={speedMaxHint ? `Ex: ${speedMaxHint}` : 'Ex: 80'}
                      inputMode="decimal"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Perfil em destaque
                </p>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="summary">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border/80 bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Perfis
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {countFormatter.format(summary.total)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Total filtrado</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Faixa térmica
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {summary.tempRange}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Temperatura</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Faixa de velocidade
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {summary.speedRange}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Velocidade de impressão</p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Mediana RMSE
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {summary.rmseMedian} {unitLabels.strain}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Qualidade do ajuste</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <Layers className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Atlas paramétrico 3D</CardTitle>
              <CardDescription>Mapa 3D e correlações entre parâmetros</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="map" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
              <TabsTrigger value="map" className="py-2.5">
                Mapa 3D
              </TabsTrigger>
              <TabsTrigger value="correlation" className="py-2.5">
                Correlações
              </TabsTrigger>
              <TabsTrigger value="ranking" className="py-2.5">
                Rankings
              </TabsTrigger>
              <TabsTrigger value="detail" className="py-2.5">
                Destaque
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-3">
              <ParameterSpaceChart
                points={chartPoints}
                highlightId={selected?.id}
                axis={{
                  x: {
                    label: axisMeta.x.label,
                    format: (value) =>
                      `${axisMeta.x.format(value)}${axisMeta.x.unit ? ` ${axisMeta.x.unit}` : ''}`,
                  },
                  y: {
                    label: axisMeta.y.label,
                    format: (value) =>
                      `${axisMeta.y.format(value)}${axisMeta.y.unit ? ` ${axisMeta.y.unit}` : ''}`,
                  },
                  z: {
                    label: axisMeta.z.label,
                    format: (value) =>
                      `${axisMeta.z.format(value)}${axisMeta.z.unit ? ` ${axisMeta.z.unit}` : ''}`,
                  },
                  color: {
                    label: axisMeta.color.label,
                    format: (value) =>
                      `${axisMeta.color.format(value)}${
                        axisMeta.color.unit ? ` ${axisMeta.color.unit}` : ''
                      }`,
                  },
                }}
              />
            </TabsContent>

            <TabsContent value="correlation" className="mt-3">
              <ParameterCorrelationChart
                points={correlationPoints}
                xLabel={axisMeta.x.label}
                yLabel={axisMeta.y.label}
                xFormatter={(value) => axisMeta.x.format(value)}
                yFormatter={(value) => axisMeta.y.format(value)}
              />
            </TabsContent>

            <TabsContent value="ranking" className="mt-3">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Melhor ajuste (RMSE)</CardTitle>
                    <CardDescription>Perfis com menor erro de calibração.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {ranking.bestFit.length ? (
                      ranking.bestFit.map((point) => (
                        <div
                          key={point.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                        >
                          <span className="font-semibold text-foreground">{point.profile}</span>
                          <Badge variant="outline">
                            {strainFormatter.format(point.rmse)} {unitLabels.strain}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p>Sem dados suficientes.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle>Maior tenacidade</CardTitle>
                    <CardDescription>Perfis com maior energia acumulada.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {ranking.topToughness.length ? (
                      ranking.topToughness.map((point) => (
                        <div
                          key={point.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                        >
                          <span className="font-semibold text-foreground">{point.profile}</span>
                          <Badge variant="outline">
                            {energyFormatter.format(
                              convertEnergyDensity(point.toughness, settings.unitSystem) ??
                                point.toughness
                            )}{' '}
                            {unitLabels.energy}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p>Sem dados suficientes.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detail" className="mt-3">
              {selected ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: 'E', label: 'E', unit: unitLabels.stress },
                    { key: 'sigma_0', label: 'σ₀', unit: unitLabels.stress },
                    { key: 'n', label: 'n', unit: '' },
                    { key: 'rmse', label: 'RMSE', unit: unitLabels.strain },
                    { key: 'yieldStress', label: 'σy', unit: unitLabels.stress },
                    { key: 'ultimateStress', label: 'σUTS', unit: unitLabels.stress },
                    { key: 'ductility', label: 'Ductilidade', unit: '%' },
                    { key: 'resilience', label: 'Resiliência', unit: unitLabels.energy },
                    { key: 'toughness', label: 'Tenacidade', unit: unitLabels.energy },
                  ].map((metric) => {
                    const option = metricMap.get(metric.key as MetricKey)
                    const formatter = option?.format ?? ((value: number) => value.toFixed(2))
                    const value = valueForMetric(selected, metric.key as MetricKey)
                    return (
                      <div key={metric.key} className="rounded-xl border border-border/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                          {formatter(value)}
                          {metric.unit ? ` ${metric.unit}` : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum perfil selecionado.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RambergOsgoodTrainingPoint } from '@/types'
import { calculateMechanicalProperties } from '@/lib/mechanical-properties'
import { calculateStrain, generateStressStrainCurve } from '@/lib/ramberg-osgood'
import { useSettings } from '@/components/settings-provider'
import {
  convertEnergyDensity,
  convertSpeed,
  convertStress,
  convertTemperature,
  getUnitLabels,
} from '@/lib/units'
import { StressStrainValidationChart } from '@/components/charts/stress-strain-validation-chart'
import { RambergOsgoodLinearizationChart } from '@/components/charts/ramberg-osgood-linearization-chart'
import { CalibrationErrorSurface } from '@/components/calibration/calibration-error-surface'
import { CalibrationResidualsChart } from '@/components/calibration/calibration-residuals-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, TrendingUp } from 'lucide-react'

type CalibrationClientProps = {
  trainingData: RambergOsgoodTrainingPoint[]
}

type ResidualPoint = {
  strain: number
  residual: number
}

type MetricTileProps = {
  label: string
  value: string
  hint?: string
}

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const rmseFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 5,
  maximumFractionDigits: 5,
})

const energyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const countFormatter = new Intl.NumberFormat('pt-BR')

const makeProfileKey = (point: RambergOsgoodTrainingPoint) =>
  `${point.profile}__${point.temperature}__${point.speed}`

function MetricTile({ label, value, hint }: MetricTileProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function getQualityLabel(r2: number | null) {
  if (r2 === null) return { label: 'Indefinido', color: 'bg-muted text-muted-foreground' }
  if (r2 >= 0.985) return { label: 'Excelente', color: 'bg-foreground text-background' }
  if (r2 >= 0.965) return { label: 'Muito bom', color: 'bg-foreground/90 text-background' }
  if (r2 >= 0.94) return { label: 'Bom', color: 'bg-muted text-foreground' }
  return { label: 'Regular', color: 'bg-muted text-muted-foreground' }
}

export function CalibrationClient({ trainingData }: CalibrationClientProps) {
  const { settings } = useSettings()
  const unitLabels = getUnitLabels(settings.unitSystem)

  const options = useMemo(() => {
    return trainingData.map((point) => {
      const temperature = convertTemperature(point.temperature, settings.unitSystem) ?? point.temperature
      const speed = convertSpeed(point.speed, settings.unitSystem) ?? point.speed
      return {
        id: makeProfileKey(point),
        label: `${point.profile} • ${temperature.toFixed(0)}${unitLabels.temperature} • ${speed.toFixed(
          0
        )} ${unitLabels.speed}`,
      }
    })
  }, [settings.unitSystem, trainingData, unitLabels.speed, unitLabels.temperature])

  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '')

  useEffect(() => {
    if (!options.length) return
    if (!options.find((option) => option.id === selectedId)) {
      setSelectedId(options[0]?.id ?? '')
    }
  }, [options, selectedId])

  const selected = useMemo(() => {
    if (!trainingData.length) return null
    const match = trainingData.find((point) => makeProfileKey(point) === selectedId)
    return match ?? trainingData[0]
  }, [selectedId, trainingData])

  const params = useMemo(
    () =>
      selected
        ? {
            E: selected.E,
            sigma_0: selected.sigma_0,
            n: selected.n,
          }
        : { E: 3000, sigma_0: 50, n: 8 },
    [selected]
  )

  const points = useMemo(() => selected?.validationPoints ?? [], [selected])
  const maxStrain = useMemo(() => {
    if (selected?.maxStrain) return selected.maxStrain
    if (!points.length) return 0.1
    return Math.max(...points.map((point) => point.strain))
  }, [points, selected])

  const curve = useMemo(() => {
    if (!points.length) return []
    return generateStressStrainCurve(params, maxStrain, 160)
  }, [params, maxStrain, points.length])

  const residuals = useMemo<ResidualPoint[]>(() => {
    if (!points.length) return []
    return [...points]
      .map((point) => ({
        strain: point.strain,
        residual: calculateStrain(point.stress, params) - point.strain,
      }))
      .filter((item) => Number.isFinite(item.residual) && Number.isFinite(item.strain))
      .sort((a, b) => a.strain - b.strain)
  }, [params, points])

  const stats = useMemo(() => {
    if (!points.length) {
      return {
        rmse: 0,
        mae: 0,
        r2: null,
        count: 0,
      }
    }
    let sum = 0
    let sumAbs = 0
    let count = 0
    const mean =
      points.reduce((acc, point) => acc + point.strain, 0) / (points.length || 1)
    let ssTot = 0
    let ssRes = 0
    for (const point of points) {
      const predicted = calculateStrain(point.stress, params)
      if (!Number.isFinite(predicted)) continue
      const diff = predicted - point.strain
      sum += diff * diff
      sumAbs += Math.abs(diff)
      ssRes += diff * diff
      ssTot += Math.pow(point.strain - mean, 2)
      count += 1
    }
    const rmse = count ? Math.sqrt(sum / count) : 0
    const mae = count ? sumAbs / count : 0
    const r2 = ssTot ? 1 - ssRes / ssTot : null
    return { rmse, mae, r2, count }
  }, [params, points])

  const properties = useMemo(
    () => calculateMechanicalProperties(params, maxStrain),
    [params, maxStrain]
  )

  const quality = useMemo(() => getQualityLabel(stats.r2), [stats.r2])

  const formatStress = (value: number) => {
    const converted = convertStress(value, settings.unitSystem) ?? value
    return `${stressFormatter.format(converted)} ${unitLabels.stress}`
  }

  const formatEnergy = (value: number) => {
    const converted = convertEnergyDensity(value, settings.unitSystem) ?? value
    return `${energyFormatter.format(converted)} ${unitLabels.energy}`
  }

  if (!trainingData.length) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Nenhum perfil calibrado</CardTitle>
          <CardDescription>
            Importe ensaios para iniciar a identificacao de parametros.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          O laboratório de calibração requer curvas experimentais para ajustar o modelo
          Ramberg-Osgood, estimar resíduos e validar o envelope de erro.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:h-[calc(100svh-220px)] lg:items-stretch lg:overflow-hidden">
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <Target className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Seleção do perfil</CardTitle>
              <CardDescription>Escolha o conjunto experimental para calibração</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
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

          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Qualidade do ajuste
                </p>
                <p className="text-xs text-muted-foreground">Baseado em R² e resíduos</p>
              </div>
              <Badge className={quality.color}>{quality.label}</Badge>
            </div>
          </div>

          <Tabs defaultValue="params" className="space-y-3">
            <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
              <TabsTrigger value="params" className="py-2.5">
                Parâmetros
              </TabsTrigger>
              <TabsTrigger value="props" className="py-2.5">
                Propriedades
              </TabsTrigger>
            </TabsList>

            <TabsContent value="params">
              <div className="grid gap-3 grid-cols-2">
                <MetricTile label="Módulo E" value={formatStress(params.E)} hint="Rigidez inicial" />
                <MetricTile
                  label="σ₀"
                  value={formatStress(params.sigma_0)}
                  hint="Tensão de referência"
                />
                <MetricTile label="n" value={params.n.toFixed(2)} hint="Encruamento" />
                <MetricTile
                  label="Pontos"
                  value={countFormatter.format(stats.count || selected?.pointsUsed || 0)}
                  hint="Amostras usadas"
                />
                <MetricTile
                  label="RMSE"
                  value={rmseFormatter.format(stats.rmse)}
                  hint={`Erro médio (${unitLabels.strain})`}
                />
                <MetricTile
                  label="MAE"
                  value={rmseFormatter.format(stats.mae)}
                  hint={`Erro absoluto (${unitLabels.strain})`}
                />
                <MetricTile
                  label="R²"
                  value={stats.r2 !== null ? stats.r2.toFixed(4) : '--'}
                  hint="Determinação"
                />
                <MetricTile
                  label="εmax"
                  value={strainFormatter.format(maxStrain)}
                  hint={`Limite experimental (${unitLabels.strain})`}
                />
              </div>
            </TabsContent>

            <TabsContent value="props">
              <div className="grid gap-3 grid-cols-2">
                <MetricTile
                  label="σy"
                  value={formatStress(properties.yieldStress)}
                  hint="Tensão de escoamento"
                />
                <MetricTile
                  label="σUTS"
                  value={formatStress(properties.ultimateStress)}
                  hint="Tensão máxima"
                />
                <MetricTile
                  label="Ductilidade"
                  value={`${properties.ductility.toFixed(2)} %`}
                  hint="Deformação total"
                />
                <MetricTile
                  label="Tenacidade"
                  value={formatEnergy(properties.toughness)}
                  hint={`Energia específica (${unitLabels.energy})`}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <TrendingUp className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Análises visuais</CardTitle>
              <CardDescription>Mapas 3D, curva calibrada e diagnósticos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="error" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto gap-1 p-1">
              <TabsTrigger value="error" className="py-2.5">
                Erro 3D
              </TabsTrigger>
              <TabsTrigger value="curve" className="py-2.5">
                Curva
              </TabsTrigger>
              <TabsTrigger value="residuals" className="py-2.5">
                Resíduos
              </TabsTrigger>
              <TabsTrigger value="linear" className="py-2.5">
                Log-Log
              </TabsTrigger>
              <TabsTrigger value="notes" className="py-2.5">
                Notas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="error" className="mt-3">
              <CalibrationErrorSurface points={points} params={params} />
            </TabsContent>

            <TabsContent value="curve" className="mt-3">
              <StressStrainValidationChart
                curve={curve}
                points={points}
                unitSystem={settings.unitSystem}
                interactive={settings.interactiveCharts}
              />
            </TabsContent>

            <TabsContent value="residuals" className="mt-3">
              <CalibrationResidualsChart
                data={residuals}
                unitSystem={settings.unitSystem}
                interactive={settings.interactiveCharts}
              />
            </TabsContent>

            <TabsContent value="linear" className="mt-3">
              <RambergOsgoodLinearizationChart
                points={points}
                unitSystem={settings.unitSystem}
                interactive={settings.interactiveCharts}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Método: selecionar o intervalo elastoplastico, ajustar E, σ₀ e n por minima
                  quadrática e validar com resíduos e linearização log-log.
                </p>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-xs">
                  RMSE = sqrt( (1/N) * sum( (eps_pred - eps_exp)^2 ) )
                </div>
                <p>
                  Recomenda-se registrar faixa de tensao aplicada e pontos descartados para
                  reprodutibilidade.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

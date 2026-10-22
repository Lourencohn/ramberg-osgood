'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PredictionCurvesChart } from '@/components/charts/prediction-curves-chart'
import { StressStrainValidationChart } from '@/components/charts/stress-strain-validation-chart'
import { RambergOsgoodLinearizationChart } from '@/components/charts/ramberg-osgood-linearization-chart'
import { ResponseSurfaceChart } from '@/components/charts/response-surface-chart'
import { useSettings } from '@/components/settings-provider'
import type { Estimate, PredictionResult, RambergOsgoodTrainingPoint } from '@/types'
import type { ExportFormat } from '@/lib/settings'
import {
  buildHtmlTable,
  downloadContent,
  downloadHtmlAsExcel,
  openPrintWindow,
  toCsv,
} from '@/lib/export'
import {
  convertEnergyDensity,
  convertSpeed,
  convertStress,
  convertTemperature,
  getUnitLabels,
} from '@/lib/units'
import {
  BarChart3,
  LineChart,
  Box,
  Zap,
  Target,
  Shield,
  CheckCircle2,
  Thermometer,
  Database,
  Download,
} from 'lucide-react'

type ResultsDisplayProps = {
  result: PredictionResult | null
  trainingData: RambergOsgoodTrainingPoint[]
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const tempFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const speedFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const modulusFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max)

const formatWithUnit = (
  value: number | null | undefined,
  formatter: Intl.NumberFormat,
  unit?: string
) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return unit ? `-- ${unit}` : '--'
  }
  const formatted = formatter.format(value)
  return unit ? `${formatted} ${unit}` : formatted
}

const formatEstimate = (
  estimate: Estimate | null | undefined,
  convert: (value: number) => number | null,
  formatter: Intl.NumberFormat,
  unit: string
) => {
  const mean = estimate ? convert(estimate.mean) : null
  const deviation = estimate ? convert(estimate.deviation) : null
  if (mean === null || deviation === null) return `-- ${unit}`
  return `${formatter.format(mean)} ± ${formatter.format(deviation)} ${unit}`
}

export function ResultsDisplay({ result, trainingData }: ResultsDisplayProps) {
  const { settings } = useSettings()
  const [activeTab, setActiveTab] = useState('properties')
  const unitLabels = getUnitLabels(settings.unitSystem)
  const params = result?.rambergOsgood
  const properties = result?.properties
  const experimental = result?.experimental ?? null
  const validTraining = useMemo(
    () =>
      trainingData.filter(
        (point) =>
          Number.isFinite(point.temperature) &&
          point.temperature > 0 &&
          Number.isFinite(point.speed) &&
          point.speed > 0 &&
          Number.isFinite(point.E) &&
          point.E > 0 &&
          Number.isFinite(point.sigma_0) &&
          point.sigma_0 > 0 &&
          Number.isFinite(point.n) &&
          point.n > 0 &&
          Number.isFinite(point.maxStrain) &&
          point.maxStrain > 0
      ),
    [trainingData]
  )
  const validationProfile = useMemo(() => {
    if (!result || !validTraining.length) return null

    const exact = validTraining.find(
      (profile) =>
        profile.temperature === result.input.temperature && profile.speed === result.input.speed
    )
    if (exact) {
      return { profile: exact, isExact: true }
    }

    let closest = validTraining[0]
    let closestDistance = Number.POSITIVE_INFINITY

    for (const profile of validTraining) {
      const dx = profile.temperature - result.input.temperature
      const dy = profile.speed - result.input.speed
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < closestDistance) {
        closestDistance = distance
        closest = profile
      }
    }

    return { profile: closest, isExact: false }
  }, [result, validTraining])
  const validationPoints = validationProfile?.profile.validationPoints ?? []
  const referenceRuns = validationProfile?.profile.runs ?? []
  const diagnostics = useMemo(() => {
    if (!result || !validTraining.length) return null

    const temperatures = validTraining.map((point) => point.temperature)
    const speeds = validTraining.map((point) => point.speed)
    const tempMin = Math.min(...temperatures)
    const tempMax = Math.max(...temperatures)
    const speedMin = Math.min(...speeds)
    const speedMax = Math.max(...speeds)
    const nearestProfile = validationProfile?.profile ?? validTraining[0]
    const tempRange = tempMax - tempMin || 1
    const speedRange = speedMax - speedMin || 1
    const dx = (result.input.temperature - nearestProfile.temperature) / tempRange
    const dy = (result.input.speed - nearestProfile.speed) / speedRange
    const normalizedDistance = Math.min(Math.sqrt(dx * dx + dy * dy) / Math.sqrt(2), 1)
    const confidence =
      normalizedDistance < 0.2 ? 'Alta' : normalizedDistance < 0.45 ? 'Moderada' : 'Baixa'
    const withinBounds =
      result.input.temperature >= tempMin &&
      result.input.temperature <= tempMax &&
      result.input.speed >= speedMin &&
      result.input.speed <= speedMax

    return {
      tempMin,
      tempMax,
      speedMin,
      speedMax,
      normalizedDistance,
      confidence,
      withinBounds,
      nearestProfile,
    }
  }, [result, validTraining, validationProfile])
  const maxStrain = result?.curve?.length ? result.curve[result.curve.length - 1].strain : null
  const confidenceClass = diagnostics
    ? diagnostics.confidence === 'Alta'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : diagnostics.confidence === 'Moderada'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-rose-200 bg-rose-50 text-rose-700'
    : 'border-border bg-muted text-muted-foreground'
  const tempPosition =
    result && diagnostics
      ? clamp(
          (result.input.temperature - diagnostics.tempMin) /
            (diagnostics.tempMax - diagnostics.tempMin || 1)
        )
      : null
  const speedPosition =
    result && diagnostics
      ? clamp(
          (result.input.speed - diagnostics.speedMin) /
            (diagnostics.speedMax - diagnostics.speedMin || 1)
        )
      : null
  const tempOutside =
    diagnostics && result
      ? result.input.temperature < diagnostics.tempMin ||
        result.input.temperature > diagnostics.tempMax
      : false
  const speedOutside =
    diagnostics && result
      ? result.input.speed < diagnostics.speedMin || result.input.speed > diagnostics.speedMax
      : false

  const formatTemperatureValue = (value: number | null | undefined) =>
    formatWithUnit(
      convertTemperature(value, settings.unitSystem),
      tempFormatter,
      unitLabels.temperature
    )

  const formatSpeedValue = (value: number | null | undefined) =>
    formatWithUnit(convertSpeed(value, settings.unitSystem), speedFormatter, unitLabels.speed)

  const formatProfileLabelWithUnits = (temperature: number, speed: number) => {
    const temp = convertTemperature(temperature, settings.unitSystem)
    const speedValue = convertSpeed(speed, settings.unitSystem)
    const hasTemp = Number.isFinite(temp ?? temperature) && (temp ?? temperature) > 0
    const hasSpeed = Number.isFinite(speedValue ?? speed) && (speedValue ?? speed) > 0

    if (hasTemp && hasSpeed) {
      return `Temperatura ${tempFormatter.format(temp ?? temperature)}${unitLabels.temperature} · Velocidade ${speedFormatter.format(
        speedValue ?? speed
      )} ${unitLabels.speed}`
    }
    if (hasTemp) {
      return `Temperatura ${tempFormatter.format(temp ?? temperature)}${unitLabels.temperature}`
    }
    if (hasSpeed) {
      return `Velocidade ${speedFormatter.format(speedValue ?? speed)} ${unitLabels.speed}`
    }
    return 'Parametros nao informados'
  }

  const modelParameters = [
    {
      code: 'E',
      label: 'Modulo de elasticidade',
      description: 'Rigidez inicial do material.',
      value: convertStress(params?.E, settings.unitSystem),
      unit: unitLabels.stress,
      formatter: numberFormatter,
    },
    {
      code: 'σ₀',
      label: 'Tensao de referencia',
      description:
        params && properties && params.sigma_0 > properties.ultimateStress
          ? 'Acima da tensão máxima: a curva rompe antes de chegar a esse escoamento.'
          : 'Marco de escoamento com offset de 0,2%.',
      value: convertStress(params?.sigma_0, settings.unitSystem),
      unit: unitLabels.stress,
      formatter: stressFormatter,
    },
    {
      code: 'n',
      label: 'Expoente de encruamento',
      description: 'Define a curvatura no regime plastico.',
      value: params?.n,
      unit: '',
      formatter: numberFormatter,
    },
    {
      code: 'limite',
      label: 'Deformação na tensão máxima',
      description: 'Média ponderada dos perfis usados na interpolação.',
      value: maxStrain !== null ? maxStrain * 100 : null,
      unit: '%',
      formatter: numberFormatter,
    },
  ]

  const toStress = (value: number | null | undefined) => convertStress(value, settings.unitSystem)
  const toEnergy = (value: number | null | undefined) =>
    convertEnergyDensity(value, settings.unitSystem)

  const propertyComparison = [
    {
      label: 'Tensão máxima',
      model: formatWithUnit(toStress(properties?.ultimateStress), stressFormatter, unitLabels.stress),
      expected: formatEstimate(experimental?.ultimateStress, toStress, stressFormatter, unitLabels.stress),
    },
    {
      label: 'Deformação na tensão máxima',
      model: formatWithUnit(properties?.ductility, numberFormatter, '%'),
      expected: formatEstimate(experimental?.peakStrain, (value) => value * 100, numberFormatter, '%'),
    },
    {
      label: 'Módulo aparente',
      model: formatWithUnit(toStress(properties?.modulus), modulusFormatter, unitLabels.stress),
      expected: formatEstimate(experimental?.modulus, toStress, modulusFormatter, unitLabels.stress),
    },
    {
      label: 'Tenacidade até a tensão máxima',
      model: formatWithUnit(toEnergy(properties?.toughness), numberFormatter, unitLabels.energy),
      expected: formatWithUnit(toEnergy(experimental?.toughness), numberFormatter, unitLabels.energy),
    },
    {
      label: 'Escoamento convencional (0,2%)',
      model:
        properties && properties.yieldStress === null
          ? 'não atingido'
          : formatWithUnit(toStress(properties?.yieldStress), stressFormatter, unitLabels.stress),
      expected: '--',
    },
    {
      label: 'Resiliência',
      model:
        properties && properties.resilience === null
          ? '--'
          : formatWithUnit(toEnergy(properties?.resilience), numberFormatter, unitLabels.energy),
      expected: '--',
    },
  ]

  const referenceLabel = validationProfile
    ? `Ensaios reais em ${formatTemperatureValue(validationProfile.profile.temperature)} e ${formatSpeedValue(
        validationProfile.profile.speed
      )} (${referenceRuns.length} CPs)`
    : 'Ensaios reais'

  const sourcesSummary = experimental
    ? experimental.sources[0]?.weight === 1
      ? `Condição já ensaiada: média dos ${referenceRuns.length} corpos de prova dessa condição.`
      : `Média ponderada dos ensaios vizinhos, com maior peso para ${experimental.sources
          .slice(0, 3)
          .map(
            (source) =>
              `${formatTemperatureValue(source.temperature)} e ${formatSpeedValue(source.speed)} (${percentFormatter.format(
                source.weight * 100
              )}%)`
          )
          .join(', ')}.`
    : null

  const glossary = [
    {
      term: 'E',
      description: 'Modulo de elasticidade; indica a rigidez inicial.',
    },
    {
      term: 'σ₀',
      description: 'Tensao de referencia associada ao offset de 0,2%.',
    },
    {
      term: 'n',
      description: 'Expoente que controla a curvatura no regime plastico.',
    },
    {
      term: 'RMSE',
      description: 'Erro medio quadratico do ajuste no perfil de referencia.',
    },
    {
      term: 'Envelope experimental',
      description: 'Faixa de temperatura e velocidade coberta pelos ensaios reais.',
    },
    {
      term: 'Interpolacao RBF',
      description: 'Metodo de base radial com normalizacao min-max.',
    },
  ]

  const exportFormats: ExportFormat[] = ['csv', 'json', 'xlsx', 'pdf']

  const buildExportSummaryRows = () => {
    if (!result) return [] as Array<Array<string | number | null>>
    return [
      ['section', 'key', 'value', 'unit'],
      [
        'input',
        'temperature',
        convertTemperature(result.input.temperature, settings.unitSystem),
        unitLabels.temperature,
      ],
      ['input', 'speed', convertSpeed(result.input.speed, settings.unitSystem), unitLabels.speed],
      ['model', 'E', convertStress(params?.E, settings.unitSystem), unitLabels.stress],
      ['model', 'sigma_0', convertStress(params?.sigma_0, settings.unitSystem), unitLabels.stress],
      ['model', 'n', params?.n ?? null, ''],
      ['model', 'max_strain', maxStrain !== null ? maxStrain * 100 : null, '%'],
      [
        'properties',
        'yield_stress',
        convertStress(properties?.yieldStress, settings.unitSystem),
        unitLabels.stress,
      ],
      [
        'properties',
        'ultimate_stress',
        convertStress(properties?.ultimateStress, settings.unitSystem),
        unitLabels.stress,
      ],
      ['properties', 'ductility', properties?.ductility ?? null, '%'],
      [
        'properties',
        'resilience',
        convertEnergyDensity(properties?.resilience, settings.unitSystem),
        unitLabels.energy,
      ],
      [
        'properties',
        'toughness',
        convertEnergyDensity(properties?.toughness, settings.unitSystem),
        unitLabels.energy,
      ],
      ['properties', 'modulus', toStress(properties?.modulus), unitLabels.stress],
      [
        'experimental',
        'ultimate_stress',
        toStress(experimental?.ultimateStress.mean),
        unitLabels.stress,
      ],
      [
        'experimental',
        'ultimate_stress_sd',
        toStress(experimental?.ultimateStress.deviation),
        unitLabels.stress,
      ],
      [
        'experimental',
        'peak_strain',
        experimental ? experimental.peakStrain.mean * 100 : null,
        '%',
      ],
      [
        'experimental',
        'peak_strain_sd',
        experimental ? experimental.peakStrain.deviation * 100 : null,
        '%',
      ],
      ['experimental', 'modulus', toStress(experimental?.modulus?.mean), unitLabels.stress],
      [
        'experimental',
        'modulus_sd',
        toStress(experimental?.modulus?.deviation),
        unitLabels.stress,
      ],
      ['experimental', 'toughness', toEnergy(experimental?.toughness), unitLabels.energy],
    ]
  }

  const buildCurveRows = () => {
    if (!result?.curve?.length) return [] as Array<Array<string | number | null>>
    return result.curve.map((point) => [
      point.strain,
      convertStress(point.stress, settings.unitSystem) ?? point.stress,
    ])
  }

  const buildExpectedCurveRows = () => {
    if (!experimental?.curve.length) return [] as Array<Array<string | number | null>>
    return experimental.curve.map((point) => [
      point.strain,
      toStress(point.stress) ?? point.stress,
      toStress(point.deviation) ?? point.deviation,
    ])
  }

  const expectedCurveHeader = [
    `strain (${unitLabels.strain})`,
    `expected_stress (${unitLabels.stress})`,
    `stress_deviation (${unitLabels.stress})`,
  ]

  const buildCsvExport = () => {
    const summaryRows = buildExportSummaryRows()
    if (!summaryRows.length) return ''
    const summaryCsv = toCsv(summaryRows)
    if (!settings.exportIncludeCharts) {
      return summaryCsv
    }
    const curveRows = buildCurveRows()
    if (!curveRows.length) return summaryCsv
    const curveHeader = [`strain (${unitLabels.strain})`, `stress (${unitLabels.stress})`]
    const curveCsv = toCsv([curveHeader, ...curveRows])
    const expectedRows = buildExpectedCurveRows()
    const expectedCsv = expectedRows.length ? `\n\n${toCsv([expectedCurveHeader, ...expectedRows])}` : ''
    return `${summaryCsv}\n\n${curveCsv}${expectedCsv}`
  }

  const buildJsonExport = () => {
    if (!result) return ''
    const payload: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      units: unitLabels,
      input: {
        temperature: convertTemperature(result.input.temperature, settings.unitSystem),
        speed: convertSpeed(result.input.speed, settings.unitSystem),
      },
      interpolationMethod: 'rbf',
      rambergOsgood: {
        E: convertStress(params?.E, settings.unitSystem),
        sigma_0: convertStress(params?.sigma_0, settings.unitSystem),
        n: params?.n ?? null,
        maxStrain: maxStrain,
      },
      experimental: experimental
        ? {
            ultimateStress: toStress(experimental.ultimateStress.mean),
            ultimateStressDeviation: toStress(experimental.ultimateStress.deviation),
            peakStrain: experimental.peakStrain.mean,
            peakStrainDeviation: experimental.peakStrain.deviation,
            modulus: toStress(experimental.modulus?.mean),
            modulusDeviation: toStress(experimental.modulus?.deviation),
            toughness: toEnergy(experimental.toughness),
            sources: experimental.sources,
          }
        : null,
      properties: {
        yieldStress: convertStress(properties?.yieldStress, settings.unitSystem),
        ultimateStress: convertStress(properties?.ultimateStress, settings.unitSystem),
        ductility: properties?.ductility ?? null,
        resilience: convertEnergyDensity(properties?.resilience, settings.unitSystem),
        toughness: convertEnergyDensity(properties?.toughness, settings.unitSystem),
      },
    }

    if (settings.exportIncludeCharts) {
      payload.curve = buildCurveRows().map(([strain, stress]) => ({
        strain,
        stress,
      }))
      payload.expectedCurve = buildExpectedCurveRows().map(([strain, stress, deviation]) => ({
        strain,
        stress,
        deviation,
      }))
    }

    return JSON.stringify(payload, null, 2)
  }

  const buildHtmlExport = () => {
    if (!result) return ''
    const summaryRows = buildExportSummaryRows().slice(1)
    const summaryTable = buildHtmlTable(['Seção', 'Campo', 'Valor', 'Unidade'], summaryRows)
    const curveRows = buildCurveRows()
    const curveTable =
      settings.exportIncludeCharts && curveRows.length
        ? buildHtmlTable(
            [`Strain (${unitLabels.strain})`, `Stress (${unitLabels.stress})`],
            curveRows
          )
        : ''

    const expectedRows = buildExpectedCurveRows()
    const expectedTable =
      settings.exportIncludeCharts && expectedRows.length
        ? buildHtmlTable(expectedCurveHeader, expectedRows)
        : ''

    return `
      <h1>Resultados da Previsao</h1>
      ${summaryTable}
      ${curveTable ? `<h2>Curva tensao x deformacao</h2>${curveTable}` : ''}
      ${expectedTable ? `<h2>Curva experimental esperada</h2>${expectedTable}` : ''}
    `
  }

  const handleExport = (format: ExportFormat) => {
    if (!result) return
    const baseName = `predicao-${result.input.temperature}-${result.input.speed}-${new Date()
      .toISOString()
      .slice(0, 10)}`

    if (format === 'csv') {
      downloadContent(`${baseName}.csv`, buildCsvExport(), 'text/csv;charset=utf-8')
      return
    }
    if (format === 'json') {
      downloadContent(`${baseName}.json`, buildJsonExport(), 'application/json')
      return
    }
    const html = buildHtmlExport()
    if (format === 'xlsx') {
      downloadHtmlAsExcel(`${baseName}.xlsx`, html)
      return
    }
    if (format === 'pdf') {
      openPrintWindow('Relatorio de Predicao', html)
    }
  }

  return (
    <Card className="flex-1 xl:min-h-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Resultados da Previsao</CardTitle>
            <CardDescription>
              Leitura tecnica das propriedades calculadas e da confiabilidade.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Modelo Ramberg-Osgood</Badge>
            <Badge variant="secondary">RBF Gaussiana</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={!result}>
                  <Download className="size-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleExport(settings.exportFormat)}>
                  Exportar {settings.exportFormat.toUpperCase()} (padrão)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {exportFormats.map((format) => (
                  <DropdownMenuItem key={format} onSelect={() => handleExport(format)}>
                    {format.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="@container flex min-h-0 flex-1 flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-0 w-full flex-1">
          <TabsList className="grid w-full shrink-0 grid-cols-2 @sm:grid-cols-4 h-auto @sm:h-9">
            <TabsTrigger value="properties" className="gap-1.5 py-2 @sm:py-0 text-xs min-w-0 overflow-hidden">
              <BarChart3 className="size-4 shrink-0" />
              <span className="@sm:hidden truncate">Resumo</span>
              <span className="hidden @sm:block truncate">Resumo tecnico</span>
            </TabsTrigger>
            <TabsTrigger value="curve" className="gap-1.5 py-2 @sm:py-0 text-xs min-w-0 overflow-hidden">
              <LineChart className="size-4 shrink-0" />
              <span className="@sm:hidden truncate">Curva</span>
              <span className="hidden @sm:block truncate">Curva tensao×deform.</span>
            </TabsTrigger>
            <TabsTrigger value="surfaces" className="gap-1.5 py-2 @sm:py-0 text-xs min-w-0 overflow-hidden">
              <Box className="size-4 shrink-0" />
              <span className="@sm:hidden truncate">Sup. 3D</span>
              <span className="hidden @sm:block truncate">Superficie 3D</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-1.5 py-2 @sm:py-0 text-xs min-w-0 overflow-hidden">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="truncate">Validacao</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-1 space-y-3 xl:min-h-0 xl:overflow-y-auto">
            {!result ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                Gere uma previsao para visualizar os indicadores tecnicos.
              </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-white dark:bg-black dark:text-white p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Thermometer className="size-4 text-foreground" />
                  Entrada da simulacao
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Temperatura</span>
                    <span className="font-mono font-semibold text-foreground">
                      {result ? formatTemperatureValue(result.input.temperature) : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Velocidade</span>
                    <span className="font-mono font-semibold text-foreground">
                      {result ? formatSpeedValue(result.input.speed) : '--'}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {diagnostics
                    ? diagnostics.withinBounds
                      ? 'Entrada dentro do envelope experimental.'
                      : 'Entrada fora da faixa observada; resultados representam extrapolacao.'
                    : 'Sem dados suficientes para avaliar o envelope experimental.'}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white dark:bg-black dark:text-white p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Database className="size-4 text-foreground" />
                  Envelope experimental
                </div>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Temperatura ({unitLabels.temperature})</span>
                      <span className="font-mono text-foreground">
                        {diagnostics
                          ? `${formatTemperatureValue(diagnostics.tempMin)} a ${formatTemperatureValue(
                              diagnostics.tempMax
                            )}`
                          : '--'}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted">
                      {tempPosition !== null ? (
                        <span
                          className={`absolute top-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-background ${
                            tempOutside ? 'bg-rose-500' : 'bg-foreground'
                          }`}
                          style={{ left: `calc(${tempPosition * 100}% - 6px)` }}
                        />
                      ) : (
                        <span className="absolute inset-0 rounded-full border border-dashed border-border" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Min</span>
                      <span>Max</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Velocidade ({unitLabels.speed})</span>
                      <span className="font-mono text-foreground">
                        {diagnostics
                          ? `${formatSpeedValue(diagnostics.speedMin)} a ${formatSpeedValue(
                              diagnostics.speedMax
                            )}`
                          : '--'}
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted">
                      {speedPosition !== null ? (
                        <span
                          className={`absolute top-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-background ${
                            speedOutside ? 'bg-rose-500' : 'bg-foreground'
                          }`}
                          style={{ left: `calc(${speedPosition * 100}% - 6px)` }}
                        />
                      ) : (
                        <span className="absolute inset-0 rounded-full border border-dashed border-border" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Min</span>
                      <span>Max</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white dark:bg-black dark:text-white p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="size-4 text-foreground" />
                  Qualidade do ajuste
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Confiabilidade</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${confidenceClass}`}
                    >
                      {diagnostics?.confidence ?? '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Distancia normalizada</span>
                    <span className="font-mono font-semibold text-foreground">
                      {diagnostics ? strainFormatter.format(diagnostics.normalizedDistance) : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Perfil de referencia</span>
                    <span className="font-medium text-foreground">
                      {diagnostics
                        ? formatProfileLabelWithUnits(
                            diagnostics.nearestProfile.temperature,
                            diagnostics.nearestProfile.speed
                          )
                        : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Pontos no ajuste</span>
                    <span className="font-mono font-semibold text-foreground">
                      {diagnostics ? diagnostics.nearestProfile.pointsUsed : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">RMSE (deformacao)</span>
                    <span className="font-mono font-semibold text-foreground">
                      {diagnostics ? strainFormatter.format(diagnostics.nearestProfile.rmse) : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Perfis reais</span>
                    <span className="font-mono font-semibold text-foreground">
                      {validTraining.length || '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-xl border border-foreground/20 bg-white dark:bg-black dark:text-white p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/10">
                    <Zap className="size-4 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Parametros do modelo</h3>
                    <p className="text-xs text-muted-foreground">
                      Ajuste Ramberg-Osgood com offset de 0,2% e interpolacao por base radial.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {modelParameters.map((param) => (
                    <div
                      key={param.code}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white dark:bg-black dark:text-white px-3 py-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{param.code}</Badge>
                          <p className="text-sm font-medium text-foreground">{param.label}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                      </div>
                      <span className="font-mono font-semibold text-foreground">
                        {formatWithUnit(param.value, param.formatter, param.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white dark:bg-black dark:text-white p-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Target className="size-4 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Propriedades previstas</h3>
                    <p className="text-xs text-muted-foreground">
                      Modelo Ramberg-Osgood ao lado da média ponderada dos ensaios reais, com ± 1
                      desvio-padrão.
                    </p>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">Propriedade</th>
                      <th className="py-1.5 pr-3 text-right font-medium">Ramberg-Osgood</th>
                      <th className="py-1.5 text-right font-medium">Experimental esperada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {propertyComparison.map((row) => (
                      <tr key={row.label}>
                        <td className="py-1.5 pr-3 text-muted-foreground">{row.label}</td>
                        <td className="py-1.5 pr-3 text-right font-mono font-semibold text-foreground">
                          {row.model}
                        </td>
                        <td className="py-1.5 text-right font-mono font-semibold text-foreground">
                          {row.expected}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-muted-foreground">
                  Escoamento e resiliência dependem do offset de 0,2%, que não se sustenta numa
                  curva quase linear até a ruptura; por isso aparecem só no modelo.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white dark:bg-black dark:text-white p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Database className="size-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Glossario de nomenclaturas</h3>
                  <p className="text-xs text-muted-foreground">
                    Referencia rapida para leitura por publico externo.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2 @5xl:grid-cols-3">
                {glossary.map((item) => (
                  <div
                    key={item.term}
                    className="rounded-lg border border-border bg-white dark:bg-black dark:text-white px-3 py-2 text-xs"
                  >
                    <p className="font-semibold text-foreground">{item.term}</p>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {settings.debugMode ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="size-4 text-foreground" />
                  <span className="font-semibold text-foreground">Detalhes técnicos</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Interpolação aplicada</span>
                    <span className="font-mono font-semibold">
                      {result ? 'RBF Gaussiana' : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Pontos na curva</span>
                    <span className="font-mono font-semibold">{settings.stressCurvePoints}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Perfis reais</span>
                    <span className="font-mono font-semibold">{validTraining.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Pontos de validacao</span>
                    <span className="font-mono font-semibold">
                      {validationPoints.length || '--'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="curve" className="mt-1 flex min-h-[440px] flex-col gap-2">
            {experimental ? (
              <div className="shrink-0 rounded-lg border border-border bg-white dark:bg-black dark:text-white px-3 py-2 text-xs text-muted-foreground">
                <p>
                  Ruptura esperada em{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {formatEstimate(experimental.peakStrain, (value) => value * 100, numberFormatter, '%')}
                  </span>{' '}
                  de deformação, com{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {formatEstimate(experimental.ultimateStress, toStress, stressFormatter, unitLabels.stress)}
                  </span>
                  . {sourcesSummary}
                </p>
              </div>
            ) : null}
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border p-3">
              <PredictionCurvesChart
                modelCurve={result?.curve ?? []}
                experimental={experimental}
                runs={referenceRuns}
                runsLabel={referenceLabel}
                unitSystem={settings.unitSystem}
                interactive={settings.interactiveCharts}
                className="min-h-[340px] flex-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="surfaces" className="mt-1 flex min-h-[460px] flex-col">
            <div className="flex flex-1 flex-col rounded-xl border border-border p-3 bg-white dark:bg-black dark:text-white">
              <ResponseSurfaceChart trainingData={trainingData} result={result} className="flex-1" />
            </div>
          </TabsContent>

          <TabsContent value="validation" className="mt-1 flex min-h-[440px] flex-col gap-3">
            {!result ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                Gere uma previsao para validar a curva com pontos reais.
              </div>
            ) : (
              <>
                <div className="shrink-0 rounded-lg border border-border bg-white dark:bg-black dark:text-white px-3 py-2 text-xs text-muted-foreground">
                  {validationProfile ? (
                    <p>
                      {validationProfile.isExact
                        ? 'Comparacao com dados reais na mesma condicao.'
                        : `Comparacao com o perfil real mais proximo: ${formatProfileLabelWithUnits(
                            validationProfile.profile.temperature,
                            validationProfile.profile.speed
                          )}.`}
                      {validationPoints.length
                        ? ` (${validationPoints.length} pontos amostrados)`
                        : ''}
                    </p>
                  ) : (
                    <p>Nenhum conjunto real disponivel para validacao.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 min-h-0 flex-1 gap-3 lg:grid-cols-2">
                  <div className="flex flex-col rounded-xl border border-border p-3">
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      Curva prevista x pontos reais
                    </h3>
                    <div className="relative min-h-[300px] flex-1">
                      <StressStrainValidationChart
                        curve={result.curve}
                        points={validationPoints}
                        unitSystem={settings.unitSystem}
                        interactive={settings.interactiveCharts}
                        className="absolute inset-0 h-auto"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col rounded-xl border border-border p-3">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Linearizacao Ramberg-Osgood (log-log)
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      A deformacao plastica e estimada removendo a parcela elastica; em escala
                      log-log, um bom ajuste tende a alinhar os pontos reais.
                    </p>
                    <RambergOsgoodLinearizationChart
                      points={validationPoints}
                      unitSystem={settings.unitSystem}
                      interactive={settings.interactiveCharts}
                      className="flex-1"
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

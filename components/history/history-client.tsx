'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RunMetrics } from '@/lib/dashboard-data'
import type { RunDetail } from '@/types/history'
import { useSettings } from '@/components/settings-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { StressStrainChart } from '@/components/charts/stress-strain-chart'
import { formatDataSource } from '@/lib/formatters'
import {
  convertSpeed,
  convertStrain,
  convertStress,
  convertTemperature,
  getUnitLabels,
} from '@/lib/units'
import {
  buildHtmlTable,
  downloadContent,
  downloadHtmlAsExcel,
  openPrintWindow,
  toCsv,
} from '@/lib/export'
import {
  Search,
  Download,
  Trash2,
  Eye,
  Filter,
  Thermometer,
  Gauge,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'

type HistoryClientProps = {
  runs: RunMetrics[]
  initialQuery?: string
  initialViewId?: number | null
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const tempFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const speedFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const countFormatter = new Intl.NumberFormat('pt-BR')

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

const parseNumber = (value: string) => {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function HistoryClient({
  runs,
  initialQuery = '',
  initialViewId = null,
}: HistoryClientProps) {
  const { settings } = useSettings()
  const unitLabels = getUnitLabels(settings.unitSystem)
  const [query, setQuery] = useState(initialQuery)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    source: 'all',
    stress: 'all',
    temperatureMin: '',
    temperatureMax: '',
    speedMin: '',
    speedMax: '',
  })

  const [detailOpen, setDetailOpen] = useState(Boolean(initialViewId))
  const [detailId, setDetailId] = useState<number | null>(initialViewId)
  const [detail, setDetail] = useState<RunDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailCache, setDetailCache] = useState<Record<number, RunDetail>>({})

  const orderedRuns = useMemo(() => {
    return [...runs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [runs])

  const runsWithStress = useMemo(
    () => orderedRuns.filter((run) => run.maxStress !== null).length,
    [orderedRuns]
  )

  const lastRunLabel = useMemo(() => {
    const last = orderedRuns[0]
    return last ? dateFormatter.format(new Date(last.createdAt)) : '—'
  }, [orderedRuns])

  const sources = useMemo(() => {
    const unique = new Set<string>()
    for (const run of runs) {
      if (run.source) unique.add(run.source)
    }
    return Array.from(unique)
  }, [runs])

  const isFiltered = useMemo(() => {
    return (
      query.trim().length > 0 ||
      filters.source !== 'all' ||
      filters.stress !== 'all' ||
      filters.temperatureMin ||
      filters.temperatureMax ||
      filters.speedMin ||
      filters.speedMax
    )
  }, [filters, query])

  const filteredRuns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const tempMin = parseNumber(filters.temperatureMin)
    const tempMax = parseNumber(filters.temperatureMax)
    const speedMin = parseNumber(filters.speedMin)
    const speedMax = parseNumber(filters.speedMax)

    return orderedRuns.filter((run) => {
      const convertedTemp =
        convertTemperature(run.temperature, settings.unitSystem) ?? run.temperature
      const convertedSpeed = convertSpeed(run.speed, settings.unitSystem) ?? run.speed

      if (normalizedQuery) {
        const haystack = [
          `ensaio ${run.testNumber}`,
          run.testCode ?? '',
          run.profileCode ?? '',
          `${convertedTemp}`,
          `${convertedSpeed}`,
          run.source ?? '',
          formatDataSource(run.source) ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }

      if (filters.source !== 'all' && run.source !== filters.source) {
        return false
      }

      if (filters.stress === 'with' && run.maxStress === null) return false
      if (filters.stress === 'without' && run.maxStress !== null) return false

      if (tempMin !== null && convertedTemp < tempMin) return false
      if (tempMax !== null && convertedTemp > tempMax) return false
      if (speedMin !== null && convertedSpeed < speedMin) return false
      if (speedMax !== null && convertedSpeed > speedMax) return false

      return true
    })
  }, [filters, orderedRuns, query, settings.unitSystem])

  const loadRunDetail = useCallback(
    async (runId: number) => {
      if (detailCache[runId]) {
        setDetail(detailCache[runId])
        return detailCache[runId]
      }

      setDetailLoading(true)
      setDetailError(null)
      try {
        const response = await fetch(`/api/history/${runId}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar detalhes')
        }
        const payload = (await response.json()) as RunDetail
        setDetailCache((current) => ({ ...current, [runId]: payload }))
        setDetail(payload)
        return payload
      } catch (error) {
        setDetailError('Não foi possível carregar os detalhes do ensaio.')
        setDetail(null)
        return null
      } finally {
        setDetailLoading(false)
      }
    },
    [detailCache]
  )

  const openDetail = useCallback(
    async (runId: number) => {
      setDetailId(runId)
      setDetailOpen(true)
      await loadRunDetail(runId)
    },
    [loadRunDetail]
  )

  useEffect(() => {
    if (initialViewId && detailId !== initialViewId) {
      openDetail(initialViewId)
    }
  }, [detailId, initialViewId, openDetail])

  const buildSummaryRows = (items: RunMetrics[]) => {
    const header = [
      'id',
      'test_number',
      'test_code',
      'profile',
      `temperature (${unitLabels.temperature})`,
      `speed (${unitLabels.speed})`,
      `max_stress (${unitLabels.stress})`,
      `max_strain (${unitLabels.strain})`,
      'points',
      'source',
      'created_at',
    ]
    const rows = items.map((run) => [
      run.id,
      run.testNumber,
      run.testCode,
      run.profileCode,
      convertTemperature(run.temperature, settings.unitSystem),
      convertSpeed(run.speed, settings.unitSystem),
      convertStress(run.maxStress, settings.unitSystem),
      convertStrain(run.maxStrain),
      run.pointCount,
      formatDataSource(run.source) ?? run.source ?? '',
      run.createdAt,
    ])
    return [header, ...rows]
  }

  const buildSummaryJson = (items: RunMetrics[]) => {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        units: unitLabels,
        runs: items.map((run) => ({
          id: run.id,
          testNumber: run.testNumber,
          testCode: run.testCode,
          profileCode: run.profileCode,
          temperature: convertTemperature(run.temperature, settings.unitSystem),
          speed: convertSpeed(run.speed, settings.unitSystem),
          maxStress: convertStress(run.maxStress, settings.unitSystem),
          maxStrain: convertStrain(run.maxStrain),
          pointCount: run.pointCount,
          source: formatDataSource(run.source) ?? run.source,
          createdAt: run.createdAt,
        })),
      },
      null,
      2
    )
  }

  const buildSummaryHtml = (items: RunMetrics[]) => {
    const rows = buildSummaryRows(items)
    const header = rows[0] as string[]
    const bodyRows = rows.slice(1)
    return `
      <h1>Historico de Ensaios</h1>
      ${buildHtmlTable(header, bodyRows)}
    `
  }

  const exportRuns = filteredRuns

  const handleExportAll = (format: 'csv' | 'json' | 'xlsx' | 'pdf') => {
    const baseName = `historico-${new Date().toISOString().slice(0, 10)}`
    if (format === 'csv') {
      downloadContent(
        `${baseName}.csv`,
        toCsv(buildSummaryRows(exportRuns)),
        'text/csv;charset=utf-8'
      )
      return
    }
    if (format === 'json') {
      downloadContent(`${baseName}.json`, buildSummaryJson(exportRuns), 'application/json')
      return
    }
    const html = buildSummaryHtml(exportRuns)
    if (format === 'xlsx') {
      downloadHtmlAsExcel(`${baseName}.xlsx`, html)
      return
    }
    if (format === 'pdf') {
      openPrintWindow('Historico de Ensaios', html)
    }
  }

  const buildRunDetailSummaryRows = (item: RunDetail) => {
    return [
      ['field', 'value', 'unit'],
      ['test_number', item.testNumber, ''],
      ['test_code', item.testCode ?? '', ''],
      ['profile', item.profileCode, ''],
      [
        'temperature',
        convertTemperature(item.temperature, settings.unitSystem),
        unitLabels.temperature,
      ],
      ['speed', convertSpeed(item.speed, settings.unitSystem), unitLabels.speed],
      ['max_stress', convertStress(item.maxStress, settings.unitSystem), unitLabels.stress],
      ['max_strain', convertStrain(item.maxStrain), unitLabels.strain],
      ['points', item.pointCount, ''],
      ['source', formatDataSource(item.source) ?? item.source ?? '', ''],
      ['created_at', item.createdAt, ''],
    ]
  }

  const buildRunDetailCurveRows = (item: RunDetail) => {
    return item.points.map((point) => [
      point.strain,
      convertStress(point.stress, settings.unitSystem) ?? point.stress,
    ])
  }

  const buildRunDetailCsv = (item: RunDetail) => {
    const summaryRows = buildRunDetailSummaryRows(item)
    if (!settings.exportIncludeCharts || !item.points.length) {
      return toCsv(summaryRows)
    }
    const curveHeader = [`strain (${unitLabels.strain})`, `stress (${unitLabels.stress})`]
    const curveRows = buildRunDetailCurveRows(item)
    return `${toCsv(summaryRows)}\n\n${toCsv([curveHeader, ...curveRows])}`
  }

  const buildRunDetailJson = (item: RunDetail) => {
    const payload: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      units: unitLabels,
      id: item.id,
      testNumber: item.testNumber,
      testCode: item.testCode,
      profileCode: item.profileCode,
      temperature: convertTemperature(item.temperature, settings.unitSystem),
      speed: convertSpeed(item.speed, settings.unitSystem),
      maxStress: convertStress(item.maxStress, settings.unitSystem),
      maxStrain: convertStrain(item.maxStrain),
      pointCount: item.pointCount,
      source: formatDataSource(item.source) ?? item.source,
      createdAt: item.createdAt,
    }

    if (settings.exportIncludeCharts) {
      payload.points = buildRunDetailCurveRows(item).map(([strain, stress]) => ({
        strain,
        stress,
      }))
    }

    return JSON.stringify(payload, null, 2)
  }

  const buildRunDetailHtml = (item: RunDetail) => {
    const summaryRows = buildRunDetailSummaryRows(item).slice(1)
    const summaryTable = buildHtmlTable(['Campo', 'Valor', 'Unidade'], summaryRows)
    const curveRows = buildRunDetailCurveRows(item)
    const curveTable =
      settings.exportIncludeCharts && curveRows.length
        ? buildHtmlTable(
            [`Strain (${unitLabels.strain})`, `Stress (${unitLabels.stress})`],
            curveRows
          )
        : ''

    return `
      <h1>Detalhes do Ensaio ${item.testNumber}</h1>
      ${summaryTable}
      ${curveTable ? `<h2>Curva tensao x deformacao</h2>${curveTable}` : ''}
    `
  }

  const handleExportRun = async (runId: number, format: 'csv' | 'json' | 'xlsx' | 'pdf') => {
    const detailItem = (await loadRunDetail(runId)) ?? detailCache[runId]
    if (!detailItem) return
    const baseName = `ensaio-${detailItem.testNumber}-${new Date().toISOString().slice(0, 10)}`

    if (format === 'csv') {
      downloadContent(`${baseName}.csv`, buildRunDetailCsv(detailItem), 'text/csv;charset=utf-8')
      return
    }
    if (format === 'json') {
      downloadContent(`${baseName}.json`, buildRunDetailJson(detailItem), 'application/json')
      return
    }
    const html = buildRunDetailHtml(detailItem)
    if (format === 'xlsx') {
      downloadHtmlAsExcel(`${baseName}.xlsx`, html)
      return
    }
    if (format === 'pdf') {
      openPrintWindow(`Ensaio ${detailItem.testNumber}`, html)
    }
  }

  const exportFormats: Array<'csv' | 'json' | 'xlsx' | 'pdf'> = ['csv', 'json', 'xlsx', 'pdf']

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Histórico de Ensaios</h1>
          <p className="mt-1.5 text-muted-foreground">
            Gerencie e exporte os ensaios importados no banco
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 shadow-sm" disabled={!exportRuns.length}>
              <FileSpreadsheet className="size-4" />
              Exportar Tudo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleExportAll(settings.exportFormat)}>
              Exportar {settings.exportFormat.toUpperCase()} (padrão)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {exportFormats.map((format) => (
              <DropdownMenuItem key={format} onSelect={() => handleExportAll(format)}>
                {format.toUpperCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-foreground to-foreground/90 text-background border-foreground">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-background/20">
                <FileSpreadsheet className="size-5 text-background" />
              </div>
              <div>
                <p className="text-2xl font-bold text-background">
                  {countFormatter.format(orderedRuns.length)}
                </p>
                <p className="text-xs text-background/70">Total de Ensaios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <CheckCircle2 className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{countFormatter.format(runsWithStress)}</p>
                <p className="text-xs text-muted-foreground">Com tensão calculada</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Calendar className="size-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lastRunLabel}</p>
                <p className="text-xs text-muted-foreground">Último ensaio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ensaio, temperatura ou velocidade..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowFilters((current) => !current)}
            >
              <Filter className="size-4" />
              Filtrar
            </Button>
          </div>
          {showFilters ? (
            <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Origem</Label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={filters.source}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, source: event.target.value }))
                  }
                >
                  <option value="all">Todas</option>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {formatDataSource(source) ?? source}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tensão</Label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={filters.stress}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, stress: event.target.value }))
                  }
                >
                  <option value="all">Todas</option>
                  <option value="with">Com tensão</option>
                  <option value="without">Sem tensão</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Temperatura ({unitLabels.temperature})
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    value={filters.temperatureMin}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, temperatureMin: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Max"
                    value={filters.temperatureMax}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, temperatureMax: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Velocidade ({unitLabels.speed})
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    value={filters.speedMin}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, speedMin: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Max"
                    value={filters.speedMax}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, speedMax: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      source: 'all',
                      stress: 'all',
                      temperatureMin: '',
                      temperatureMax: '',
                      speedMin: '',
                      speedMax: '',
                    })
                  }
                >
                  Limpar filtros
                </Button>
                {isFiltered ? (
                  <span className="text-xs text-muted-foreground">
                    {filteredRuns.length} ensaios encontrados
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {filteredRuns.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Nenhum ensaio encontrado.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRuns.map((run) => {
                const tempValue = convertTemperature(run.temperature, settings.unitSystem)
                const speedValue = convertSpeed(run.speed, settings.unitSystem)
                const maxStress = convertStress(run.maxStress, settings.unitSystem)
                const maxStrain = convertStrain(run.maxStrain)

                return (
                  <div
                    key={run.id}
                    className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-foreground text-background px-2.5 py-1 font-mono text-sm font-semibold">
                          Ensaio {run.testNumber}
                        </span>
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <CheckCircle2 className="size-3 text-foreground" />
                          {run.maxStress !== null ? 'Com tensão' : 'Sem tensão'}
                        </Badge>
                        {formatDataSource(run.source) ? (
                          <Badge variant="outline" className="gap-1 text-[11px] font-normal">
                            <FileSpreadsheet className="size-3" />
                            {formatDataSource(run.source)}
                          </Badge>
                        ) : null}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          {dateFormatter.format(new Date(run.createdAt))}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                          <Thermometer className="size-4 text-foreground" />
                          <span className="text-sm">
                            <span className="text-muted-foreground">Temp:</span>{' '}
                            <span className="font-semibold">
                              {formatWithUnit(tempValue, tempFormatter, unitLabels.temperature)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                          <Gauge className="size-4 text-foreground" />
                          <span className="text-sm">
                            <span className="text-muted-foreground">Vel:</span>{' '}
                            <span className="font-semibold">
                              {formatWithUnit(speedValue, speedFormatter, unitLabels.speed)}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">σ máx:</span>
                          <span className="font-semibold text-foreground">
                            {maxStress !== null
                              ? `${stressFormatter.format(maxStress)} ${unitLabels.stress}`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">ε máx:</span>
                          <span className="font-semibold text-foreground">
                            {maxStrain !== null
                              ? `${strainFormatter.format(maxStrain)} ${unitLabels.strain}`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Pontos:</span>
                          <span className="font-semibold text-foreground">
                            {countFormatter.format(run.pointCount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-foreground/10 hover:text-foreground"
                        onClick={() => openDetail(run.id)}
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">Visualizar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-foreground/10 hover:text-foreground"
                        onClick={() => handleExportRun(run.id, settings.exportFormat)}
                      >
                        <Download className="size-4" />
                        <span className="sr-only">Baixar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-foreground/10 hover:text-foreground"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setDetailId(null)
            setDetail(null)
            setDetailError(null)
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {detail ? `Ensaio ${detail.testNumber}` : detailId ? `Ensaio ${detailId}` : 'Ensaio'}
            </SheetTitle>
            <SheetDescription>Detalhes do ensaio e curva tensão x deformação</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando detalhes...
              </div>
            ) : null}
            {detailError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {detailError}
              </div>
            ) : null}
            {detail ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <CheckCircle2 className="size-3 text-foreground" />
                    {detail.maxStress !== null ? 'Com tensão' : 'Sem tensão'}
                  </Badge>
                  {formatDataSource(detail.source) ? (
                    <Badge variant="outline" className="gap-1 text-[11px] font-normal">
                      <FileSpreadsheet className="size-3" />
                      {formatDataSource(detail.source)}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {detail.profileCode}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="font-semibold">
                      {formatWithUnit(
                        convertTemperature(detail.temperature, settings.unitSystem),
                        tempFormatter,
                        unitLabels.temperature
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">Velocidade</p>
                    <p className="font-semibold">
                      {formatWithUnit(
                        convertSpeed(detail.speed, settings.unitSystem),
                        speedFormatter,
                        unitLabels.speed
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">σ máx</p>
                    <p className="font-semibold">
                      {detail.maxStress !== null
                        ? `${stressFormatter.format(
                            convertStress(detail.maxStress, settings.unitSystem) ?? detail.maxStress
                          )} ${unitLabels.stress}`
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                    <p className="text-xs text-muted-foreground">ε máx</p>
                    <p className="font-semibold">
                      {detail.maxStrain !== null
                        ? `${strainFormatter.format(detail.maxStrain)} ${unitLabels.strain}`
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="font-semibold">
                      {dateFormatter.format(new Date(detail.createdAt))}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <StressStrainChart
                    curve={detail.points}
                    unitSystem={settings.unitSystem}
                    interactive={settings.interactiveCharts}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2 w-full">
                      <Download className="size-4" />
                      Exportar Ensaio
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => handleExportRun(detail.id, settings.exportFormat)}
                    >
                      Exportar {settings.exportFormat.toUpperCase()} (padrão)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {exportFormats.map((format) => (
                      <DropdownMenuItem
                        key={format}
                        onSelect={() => handleExportRun(detail.id, format)}
                      >
                        {format.toUpperCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

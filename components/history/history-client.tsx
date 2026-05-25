'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RunMetrics } from '@/lib/dashboard-data'
import type { RunDetail } from '@/types/history'
import { useSettings } from '@/components/settings-provider'
import { Button } from '@/components/ui/button'
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
import { formatDataSource, formatProfileTokens } from '@/lib/formatters'
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
  Eye,
  Calendar,
  FileSpreadsheet,
  Loader2,
  X,
  SlidersHorizontal,
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

const TEMPERATURE_COLOR_STOPS: Array<{ max: number; color: string }> = [
  { max: 195, color: 'var(--chart-1)' },
  { max: 205, color: 'var(--chart-2)' },
  { max: 215, color: 'var(--chart-3)' },
  { max: 225, color: 'var(--chart-4)' },
  { max: 999, color: 'var(--chart-5)' },
]

function temperatureColor(temperature: number) {
  return TEMPERATURE_COLOR_STOPS.find((stop) => temperature <= stop.max)?.color ?? 'var(--chart-5)'
}

const formatWithUnit = (
  value: number | null | undefined,
  formatter: Intl.NumberFormat,
  unit?: string
) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'sem dados'
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
    return last ? dateFormatter.format(new Date(last.createdAt)) : 'sem registros'
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
      Boolean(filters.temperatureMin) ||
      Boolean(filters.temperatureMax) ||
      Boolean(filters.speedMin) ||
      Boolean(filters.speedMax)
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
          run.material ?? '',
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
      } catch (_error) {
        setDetailError('Não foi possível carregar os detalhes deste ensaio.')
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
      'material',
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
      run.material,
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
          material: run.material,
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
      ${curveTable ? `<h2>Curva tensao por deformacao</h2>${curveTable}` : ''}
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
      {/* Editorial KPI strip */}
      <section className="grid grid-cols-2 divide-y divide-foreground/10 border-y border-foreground/15 md:grid-cols-3 md:divide-x md:divide-y-0">
        <KpiCell
          caption="Ensaios no acervo"
          value={countFormatter.format(orderedRuns.length).padStart(3, '0')}
          hint={`${countFormatter.format(runsWithStress)} com tensão calculada`}
          accent
        />
        <KpiCell
          caption="Última leitura"
          value={lastRunLabel}
          hint="Data do registro mais recente"
        />
        <KpiCell
          caption="Em exibição"
          value={countFormatter.format(filteredRuns.length).padStart(3, '0')}
          hint={isFiltered ? 'após filtros' : 'todos os ensaios'}
        />
      </section>

      {/* Toolbar: search + filters + export */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ensaio, material, temperatura, velocidade ou perfil"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 border-foreground/15 bg-card pl-10 focus-visible:ring-copper"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <Button
            variant="outline"
            className="h-10 gap-2 border-foreground/15"
            onClick={() => setShowFilters((current) => !current)}
          >
            <SlidersHorizontal className="size-4" />
            Filtrar
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-10 gap-2 bg-foreground text-background hover:bg-foreground/90"
              disabled={!exportRuns.length}
            >
              <FileSpreadsheet className="size-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleExportAll(settings.exportFormat)}>
              Exportar como {settings.exportFormat.toUpperCase()} (padrão)
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

      {showFilters ? (
        <div className="grid gap-3 rounded-md border border-foreground/15 bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Origem">
            <select
              className="h-9 w-full rounded-md border border-foreground/15 bg-background px-3 text-sm"
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
          </FilterField>
          <FilterField label="Tensão">
            <select
              className="h-9 w-full rounded-md border border-foreground/15 bg-background px-3 text-sm"
              value={filters.stress}
              onChange={(event) =>
                setFilters((current) => ({ ...current, stress: event.target.value }))
              }
            >
              <option value="all">Todas</option>
              <option value="with">Com tensão calculada</option>
              <option value="without">Sem tensão calculada</option>
            </select>
          </FilterField>
          <FilterField label={`Temperatura (${unitLabels.temperature})`}>
            <div className="flex gap-2">
              <Input
                placeholder="Mín"
                value={filters.temperatureMin}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, temperatureMin: event.target.value }))
                }
                className="h-9"
              />
              <Input
                placeholder="Máx"
                value={filters.temperatureMax}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, temperatureMax: event.target.value }))
                }
                className="h-9"
              />
            </div>
          </FilterField>
          <FilterField label={`Velocidade (${unitLabels.speed})`}>
            <div className="flex gap-2">
              <Input
                placeholder="Mín"
                value={filters.speedMin}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, speedMin: event.target.value }))
                }
                className="h-9"
              />
              <Input
                placeholder="Máx"
                value={filters.speedMax}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, speedMax: event.target.value }))
                }
                className="h-9"
              />
            </div>
          </FilterField>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-copper-deep hover:bg-copper-soft"
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
              <span className="font-mono-data text-xs text-muted-foreground">
                {countFormatter.format(filteredRuns.length)} ensaios encontrados
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Dense list */}
      {filteredRuns.length === 0 ? (
        <div className="flex items-center justify-center rounded-md border border-dashed border-foreground/20 bg-card p-10 text-center">
          <div>
            <p className="font-display text-2xl italic">Nenhum ensaio por aqui ainda.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou importe um novo arquivo para começar.
            </p>
          </div>
        </div>
      ) : (
        <article className="overflow-hidden rounded-md border border-foreground/15 bg-card">
          {/* Header row (lg+) */}
          <div className="hidden grid-cols-[1.6fr_1.1fr_0.8fr_0.8fr_0.9fr_0.9fr_0.7fr_88px] items-center gap-3 border-b border-foreground/10 bg-muted/40 px-5 py-2.5 lg:grid">
            <span className="label-caps">Ensaio</span>
            <span className="label-caps">Perfil</span>
            <span className="label-caps">Temp.</span>
            <span className="label-caps">Vel.</span>
            <span className="label-caps">σ máx</span>
            <span className="label-caps">ε máx</span>
            <span className="label-caps">Pontos</span>
            <span aria-hidden="true" />
          </div>

          <ul className="divide-y divide-foreground/8">
            {filteredRuns.map((run) => {
              const tokens = formatProfileTokens({
                material: run.material,
                temperature: run.temperature,
                speed: run.speed,
              })
              const accentColor = temperatureColor(run.temperature)
              const tempValue = convertTemperature(run.temperature, settings.unitSystem)
              const speedValue = convertSpeed(run.speed, settings.unitSystem)
              const maxStress = convertStress(run.maxStress, settings.unitSystem)
              const maxStrain = convertStrain(run.maxStrain)

              return (
                <li key={run.id} className="group">
                  <div className="grid grid-cols-1 gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40 lg:grid-cols-[1.6fr_1.1fr_0.8fr_0.8fr_0.9fr_0.9fr_0.7fr_88px] lg:items-center">
                    {/* Ensaio col */}
                    <div className="flex items-center gap-3">
                      <span
                        className="h-9 w-1 rounded-full"
                        style={{ backgroundColor: accentColor }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-lg italic">
                            Ensaio {String(run.testNumber).padStart(2, '0')}
                          </span>
                          {formatDataSource(run.source) ? (
                            <span className="label-caps text-foreground/60">
                              {formatDataSource(run.source)}
                            </span>
                          ) : null}
                        </div>
                        <p className="flex items-center gap-1.5 font-mono-data text-[11px] text-muted-foreground">
                          <Calendar className="size-3" />
                          {dateFormatter.format(new Date(run.createdAt))}
                        </p>
                      </div>
                    </div>

                    {/* Perfil col */}
                    <div className="hidden flex-col lg:flex">
                      <span className="font-display italic">{tokens.material}</span>
                      <span className="font-mono-data text-[11px] text-muted-foreground">
                        {run.profileCode}
                      </span>
                    </div>

                    {/* Mobile pills row */}
                    <div className="flex flex-wrap items-center gap-2 lg:hidden">
                      <Pill>{tokens.material}</Pill>
                      <Pill>{tokens.temperature ?? 'sem temp.'}</Pill>
                      <Pill>{tokens.speed ?? 'sem vel.'}</Pill>
                      <Pill mono>{countFormatter.format(run.pointCount)} pts</Pill>
                    </div>

                    {/* Temp/Speed/Stress/Strain/Points (desktop) */}
                    <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                      {formatWithUnit(tempValue, tempFormatter, unitLabels.temperature)}
                    </span>
                    <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                      {formatWithUnit(speedValue, speedFormatter, unitLabels.speed)}
                    </span>
                    <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                      {maxStress !== null ? (
                        <>
                          {stressFormatter.format(maxStress)}
                          <span className="text-muted-foreground"> {unitLabels.stress}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">sem dados</span>
                      )}
                    </span>
                    <span className="hidden font-mono-data text-sm tabular-nums lg:inline">
                      {maxStrain !== null ? strainFormatter.format(maxStrain) : (
                        <span className="text-muted-foreground">sem dados</span>
                      )}
                    </span>
                    <span className="hidden font-mono-data text-sm tabular-nums text-muted-foreground lg:inline">
                      {countFormatter.format(run.pointCount)}
                    </span>

                    {/* Mobile stress row */}
                    <div className="flex items-center justify-between gap-3 lg:hidden">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-2xl leading-none">
                          {maxStress !== null ? stressFormatter.format(maxStress) : 'sem'}
                        </span>
                        <span className="label-caps">{unitLabels.stress}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ActionButton
                          aria-label="Visualizar"
                          onClick={() => openDetail(run.id)}
                          icon={<Eye className="size-4" />}
                        />
                        <ActionButton
                          aria-label="Baixar"
                          onClick={() => handleExportRun(run.id, settings.exportFormat)}
                          icon={<Download className="size-4" />}
                        />
                      </div>
                    </div>

                    {/* Actions (desktop) */}
                    <div className="hidden items-center justify-end gap-1 lg:flex">
                      <ActionButton
                        aria-label="Visualizar"
                        onClick={() => openDetail(run.id)}
                        icon={<Eye className="size-4" />}
                      />
                      <ActionButton
                        aria-label="Baixar"
                        onClick={() => handleExportRun(run.id, settings.exportFormat)}
                        icon={<Download className="size-4" />}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </article>
      )}

      {/* Detail drawer */}
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
          <SheetHeader className="space-y-1 border-b border-foreground/10 pb-4">
            <span className="label-caps-copper">Folha de leitura</span>
            <SheetTitle className="font-display text-3xl italic">
              {detail ? `Ensaio ${String(detail.testNumber).padStart(2, '0')}` : detailId ? `Ensaio ${String(detailId).padStart(2, '0')}` : 'Ensaio'}
            </SheetTitle>
            <SheetDescription className="text-sm">
              Curva, propriedades e exportação do ensaio escolhido.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-5 px-1">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando detalhes
              </div>
            ) : null}
            {detailError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {detailError}
              </div>
            ) : null}
            {detail ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const tokens = formatProfileTokens({
                      material: (detail as any).material,
                      temperature: detail.temperature,
                      speed: detail.speed,
                    })
                    return (
                      <>
                        <Pill>{tokens.material}</Pill>
                        {tokens.temperature ? <Pill>{tokens.temperature}</Pill> : null}
                        {tokens.speed ? <Pill>{tokens.speed}</Pill> : null}
                      </>
                    )
                  })()}
                  {formatDataSource(detail.source) ? (
                    <Pill mono>{formatDataSource(detail.source)}</Pill>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DetailMetric
                    label="Temperatura"
                    value={formatWithUnit(
                      convertTemperature(detail.temperature, settings.unitSystem),
                      tempFormatter,
                      unitLabels.temperature
                    )}
                  />
                  <DetailMetric
                    label="Velocidade"
                    value={formatWithUnit(
                      convertSpeed(detail.speed, settings.unitSystem),
                      speedFormatter,
                      unitLabels.speed
                    )}
                  />
                  <DetailMetric
                    label="σ máx"
                    value={
                      detail.maxStress !== null
                        ? `${stressFormatter.format(
                            convertStress(detail.maxStress, settings.unitSystem) ??
                              detail.maxStress
                          )} ${unitLabels.stress}`
                        : 'sem dados'
                    }
                  />
                  <DetailMetric
                    label="ε máx"
                    value={
                      detail.maxStrain !== null
                        ? `${strainFormatter.format(detail.maxStrain)} ${unitLabels.strain}`
                        : 'sem dados'
                    }
                  />
                  <DetailMetric
                    label="Data"
                    value={dateFormatter.format(new Date(detail.createdAt))}
                    span={2}
                  />
                </div>

                <div className="rounded-md border border-foreground/15 bg-card p-4">
                  <StressStrainChart
                    curve={detail.points}
                    unitSystem={settings.unitSystem}
                    interactive={settings.interactiveCharts}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90">
                      <Download className="size-4" />
                      Exportar este ensaio
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => handleExportRun(detail.id, settings.exportFormat)}
                    >
                      Exportar como {settings.exportFormat.toUpperCase()} (padrão)
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

function KpiCell({
  caption,
  value,
  hint,
  accent,
}: {
  caption: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div className="group relative px-5 py-5">
      <div className="space-y-2">
        <span className={accent ? 'label-caps-copper' : 'label-caps'}>{caption}</span>
        <p
          className={`font-display text-[32px] leading-none tracking-tight md:text-[40px] ${
            accent ? 'text-copper-deep' : 'text-foreground'
          }`}
        >
          {value}
        </p>
        {hint ? (
          <p className="font-sans text-[11px] leading-snug text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="label-caps">{label}</Label>
      {children}
    </div>
  )
}

function Pill({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-foreground/15 bg-background px-2.5 py-0.5 text-[11px] ${
        mono ? 'font-mono-data' : ''
      }`}
    >
      {children}
    </span>
  )
}

function ActionButton({
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactNode }) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-foreground/60 transition-all hover:border-foreground/15 hover:bg-background hover:text-copper-deep"
    >
      {icon}
    </button>
  )
}

function DetailMetric({ label, value, span = 1 }: { label: string; value: string; span?: 1 | 2 }) {
  return (
    <div
      className={`rounded-md border border-foreground/15 bg-card px-4 py-3 ${
        span === 2 ? 'col-span-2' : ''
      }`}
    >
      <p className="label-caps">{label}</p>
      <p className="mt-1 font-mono-data text-sm tabular-nums">{value}</p>
    </div>
  )
}

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getRunMetrics } from '@/lib/dashboard-data'
import { formatDataSource, formatSpeed, formatTemperature } from '@/lib/formatters'
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
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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

const countFormatter = new Intl.NumberFormat('pt-BR')

export default async function HistoryPage() {
  const runs = await getRunMetrics()
  const orderedRuns = [...runs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const runsWithStress = runs.filter((run) => run.maxStress !== null).length
  const lastRun = orderedRuns[0]
  const lastRunLabel = lastRun ? dateFormatter.format(new Date(lastRun.createdAt)) : '—'
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Histórico de Ensaios</h1>
            <p className="mt-1.5 text-muted-foreground">
              Gerencie e exporte os ensaios importados no banco
            </p>
          </div>
          <Button className="gap-2 shadow-sm">
            <FileSpreadsheet className="size-4" />
            Exportar Tudo
          </Button>
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
                    {countFormatter.format(runs.length)}
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
                  className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="size-4" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {orderedRuns.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                Nenhum ensaio encontrado.
              </div>
            ) : (
              <div className="space-y-3">
                {orderedRuns.map((run) => (
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
                              {formatTemperature(run.temperature)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                          <Gauge className="size-4 text-foreground" />
                          <span className="text-sm">
                            <span className="text-muted-foreground">Vel:</span>{' '}
                            <span className="font-semibold">{formatSpeed(run.speed)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">σ máx:</span>
                          <span className="font-semibold text-foreground">
                            {run.maxStress !== null
                              ? `${stressFormatter.format(run.maxStress)} MPa`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">ε máx:</span>
                          <span className="font-semibold text-foreground">
                            {run.maxStrain !== null
                              ? `${strainFormatter.format(run.maxStrain)} mm/mm`
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
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">Visualizar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-foreground/10 hover:text-foreground"
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

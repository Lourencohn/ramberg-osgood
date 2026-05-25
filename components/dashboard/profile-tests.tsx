'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ProfileDetail } from '@/lib/dashboard-data'
import { formatDataSource, formatTestCode } from '@/lib/formatters'
import { FileText, BarChart2 } from 'lucide-react'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'

type ProfileTestsProps = {
  profiles: ProfileDetail[]
}

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

type OverlaySeries = {
  key: string
  label: string
  color: string
  points: { strain: number; stress: number }[]
}

function buildOverlayData(series: OverlaySeries[]) {
  const map = new Map<number, { strain: number } & Record<string, number | null>>()

  for (const item of series) {
    for (const point of item.points) {
      const strain = Number(point.strain.toFixed(4))
      const entry = map.get(strain) ?? { strain }
      entry[item.key] = point.stress
      map.set(strain, entry)
    }
  }

  return Array.from(map.values()).sort((a, b) => a.strain - b.strain)
}

export function ProfileTests({ profiles }: ProfileTestsProps) {
  if (!profiles.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise por perfil</CardTitle>
          <CardDescription>Nenhum ensaio encontrado no banco.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const representatives: OverlaySeries[] = profiles
    .map((profile, index) => {
      const testWithPoints = [...profile.tests]
        .filter((test) => test.points.length > 0)
        .sort((a, b) => (b.maxStress ?? 0) - (a.maxStress ?? 0))[0]

      if (!testWithPoints) return null

      return {
        key: profile.profile,
        label: profile.label,
        color: `var(--chart-${(index % 5) + 1})`,
        points: testWithPoints.points,
      }
    })
    .filter(Boolean) as OverlaySeries[]

  const overlayData = buildOverlayData(representatives)

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Análise individual por perfil</CardTitle>
        <CardDescription>Consulte cada perfil importado e os ensaios realizados.</CardDescription>
        <p className="text-xs text-muted-foreground">
          Nota: os primeiros milissegundos dos ensaios podem conter ruído da máquina; observe a
          curva a partir do início da carga.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {representatives.length > 0 && overlayData.length > 0 ? (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Comparação geral entre variantes
            </h3>
            <ChartContainer
              config={representatives.reduce(
                (acc, item) => {
                  acc[item.key] = {
                    label: item.label,
                    color: item.color,
                  }
                  return acc
                },
                {} as Record<string, { label: string; color: string }>
              )}
              className="h-[260px] w-full aspect-auto"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overlayData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="strain" className="text-[11px]" />
                  <YAxis className="text-[11px]" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {representatives.map((item) => (
                    <Line
                      key={item.key}
                      type="monotone"
                      dataKey={item.key}
                      stroke={item.color}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : null}

        {profiles.map((profile) => {
          const profileColor =
            representatives.find((item) => item.key === profile.profile)?.color ?? 'var(--chart-1)'

          return (
            <div
              key={profile.profile}
              className="rounded-xl border border-border bg-card/80 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{profile.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.profile} • {profile.tests.length} ensaios
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <BarChart2 className="size-3.5" />
                  {profile.tests.length} ensaios
                </Badge>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.tests.map((test) => (
                  <div
                    key={test.id}
                    className="rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:border-foreground/20 hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{test.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTestCode(test.testCode) ?? `Ensaio ${test.testNumber}`}
                        </p>
                      </div>
                      {formatDataSource(test.source) ? (
                        <Badge variant="outline" className="gap-1 text-[11px] font-normal">
                          <FileText className="size-3" />
                          {formatDataSource(test.source)}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>σ máx</span>
                        <span className="font-mono text-foreground font-semibold">
                          {test.maxStress !== null
                            ? `${stressFormatter.format(test.maxStress)} MPa`
                            : 'sem dados'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ε máx</span>
                        <span className="font-mono text-foreground">
                          {test.maxStrain !== null
                            ? `${strainFormatter.format(test.maxStrain)} mm/mm`
                            : 'sem dados'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Pontos</span>
                        <span className="font-mono text-foreground">{test.pointCount}</span>
                      </div>
                    </div>

                    {test.points.length > 0 ? (
                      <div className="mt-3">
                        <ChartContainer
                          config={{
                            stress: {
                              label: 'σ (MPa)',
                              color: profileColor,
                            },
                          }}
                          className="h-32"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={test.points}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="strain" hide />
                              <YAxis hide />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="stress"
                                stroke={profileColor}
                                strokeWidth={1.8}
                                dot={false}
                                connectNulls
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    ) : (
                      <p className="mt-3 text-[11px] text-muted-foreground">
                        {test.pointCount > 0
                          ? 'Sem dados de tensão/deformação no arquivo de origem.'
                          : 'Sem pontos calculados para este ensaio.'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

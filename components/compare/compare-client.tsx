"use client"

import { useMemo, useState } from "react"
import type { ProfileAverages, RunMetrics } from "@/lib/dashboard-data"
import { formatDataSource, formatProfileLabel, formatSpeed, formatTemperature } from "@/lib/formatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownRight, ArrowUpRight, Calendar, FileSpreadsheet, Gauge, GitCompare, Thermometer } from "lucide-react"

type CompareClientProps = {
  runs: RunMetrics[]
  profileAverages: ProfileAverages[]
}

type DifferenceInfo = {
  value: string
  isPositive: boolean
  isEqual: boolean
  label: string
  hasData: boolean
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const stressFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const countFormatter = new Intl.NumberFormat("pt-BR")

function getDifferenceInfo(val1: number | null, val2: number | null): DifferenceInfo {
  if (val1 === null || val2 === null || val1 === 0) {
    return {
      value: "—",
      isPositive: false,
      isEqual: false,
      label: "sem dados",
      hasData: false,
    }
  }

  const diff = (val2 / val1 - 1) * 100
  const isPositive = diff > 0
  const isEqual = Math.abs(diff) < 0.1

  return {
    value: Math.abs(diff).toFixed(1),
    isPositive,
    isEqual,
    label: isEqual ? "igual" : isPositive ? "maior" : "menor",
    hasData: true,
  }
}

function DifferenceMetric({ label, info }: { label: string; info: DifferenceInfo }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
            info.hasData && info.isPositive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
          }`}
        >
          {info.hasData && !info.isEqual ? (
            info.isPositive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />
          ) : null}
          {info.value}{info.hasData ? "%" : ""}
        </div>
        <span className="text-xs text-muted-foreground">{info.label}</span>
      </div>
    </div>
  )
}

function RunComparison({ left, right }: { left: RunMetrics; right: RunMetrics }) {
  const stressInfo = getDifferenceInfo(left.maxStress, right.maxStress)
  const strainInfo = getDifferenceInfo(left.maxStrain, right.maxStrain)
  const pointsInfo = getDifferenceInfo(left.pointCount, right.pointCount)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {[left, right].map((run, index) => (
          <Card key={run.id} className="relative overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full w-1 ${
                index === 0 ? "bg-foreground" : "bg-foreground/50"
              }`}
            />

            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`font-semibold ${
                      index === 0 ? "border-foreground/50 text-foreground" : "border-foreground/30 text-foreground/70"
                    }`}
                  >
                    Ensaio {index + 1}
                  </Badge>
                  <span className="inline-flex items-center rounded-md bg-foreground px-2.5 py-1 text-sm font-semibold text-background">
                    Ensaio {run.testNumber}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatProfileLabel(run.temperature, run.speed)}</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {dateFormatter.format(new Date(run.createdAt))}
                </span>
                {formatDataSource(run.source) ? (
                  <>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="size-3" />
                      {formatDataSource(run.source)}
                    </span>
                  </>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <Thermometer className="size-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="text-lg font-bold">{formatTemperature(run.temperature)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <Gauge className="size-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Velocidade</p>
                    <p className="text-lg font-bold">{formatSpeed(run.speed)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <h4 className="text-sm font-semibold text-foreground">Métricas do Ensaio</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tensão máxima (σ máx)</span>
                    <span className="text-sm font-bold text-foreground">
                      {run.maxStress !== null ? `${stressFormatter.format(run.maxStress)} MPa` : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deformação máxima (ε máx)</span>
                    <span className="text-sm font-bold text-foreground">
                      {run.maxStrain !== null ? `${strainFormatter.format(run.maxStrain)} mm/mm` : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pontos medidos</span>
                    <span className="text-sm font-bold text-foreground">{countFormatter.format(run.pointCount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-muted/30 to-muted/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <GitCompare className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Diferenças Relativas</CardTitle>
              <CardDescription>Comparação percentual: Ensaio 2 em relação ao Ensaio 1</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <DifferenceMetric label="Tensão máxima" info={stressInfo} />
            <DifferenceMetric label="Deformação máxima" info={strainInfo} />
            <DifferenceMetric label="Pontos medidos" info={pointsInfo} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function AverageComparison({ left, right }: { left: ProfileAverages; right: ProfileAverages }) {
  const stressInfo = getDifferenceInfo(left.avgMaxStress, right.avgMaxStress)
  const strainInfo = getDifferenceInfo(left.avgMaxStrain, right.avgMaxStrain)
  const testsInfo = getDifferenceInfo(left.tests, right.tests)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {[left, right].map((profile, index) => (
          <Card key={profile.profile} className="relative overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full w-1 ${
                index === 0 ? "bg-foreground" : "bg-foreground/50"
              }`}
            />

            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`font-semibold ${
                      index === 0 ? "border-foreground/50 text-foreground" : "border-foreground/30 text-foreground/70"
                    }`}
                  >
                    Perfil {index + 1}
                  </Badge>
                  <span className="inline-flex items-center rounded-md bg-foreground px-2.5 py-1 text-sm font-semibold text-background">
                    {profile.profile}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatProfileLabel(profile.temperature, profile.speed)} • {profile.tests} ensaios
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <Thermometer className="size-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="text-lg font-bold">{formatTemperature(profile.temperature)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <Gauge className="size-5 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Velocidade</p>
                    <p className="text-lg font-bold">{formatSpeed(profile.speed)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <h4 className="text-sm font-semibold text-foreground">Médias do Perfil</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tensão máxima média (σ máx)</span>
                    <span className="text-sm font-bold text-foreground">
                      {profile.avgMaxStress !== null ? `${stressFormatter.format(profile.avgMaxStress)} MPa` : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Deformação máxima média (ε máx)</span>
                    <span className="text-sm font-bold text-foreground">
                      {profile.avgMaxStrain !== null ? `${strainFormatter.format(profile.avgMaxStrain)} mm/mm` : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ensaios considerados</span>
                    <span className="text-sm font-bold text-foreground">{countFormatter.format(profile.tests)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-muted/30 to-muted/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <GitCompare className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Diferenças Relativas</CardTitle>
              <CardDescription>Comparação percentual: Perfil 2 em relação ao Perfil 1</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <DifferenceMetric label="Tensão máxima média" info={stressInfo} />
            <DifferenceMetric label="Deformação máxima média" info={strainInfo} />
            <DifferenceMetric label="Ensaios considerados" info={testsInfo} />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export function CompareClient({ runs, profileAverages }: CompareClientProps) {
  const orderedRuns = useMemo(
    () => [...runs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [runs],
  )
  const runOptions = useMemo(
    () =>
      orderedRuns.map((run) => ({
        value: String(run.id),
        label: `Ensaio ${run.testNumber} · ${formatProfileLabel(run.temperature, run.speed)} · ${dateFormatter.format(
          new Date(run.createdAt),
        )}`,
      })),
    [orderedRuns],
  )

  const profilesWithData = useMemo(
    () =>
      profileAverages.filter((profile) => profile.avgMaxStress !== null || profile.avgMaxStrain !== null),
    [profileAverages],
  )
  const orderedProfiles = useMemo(
    () =>
      [...profilesWithData].sort((a, b) => {
        const tempA = a.temperature > 0 ? a.temperature : Number.POSITIVE_INFINITY
        const tempB = b.temperature > 0 ? b.temperature : Number.POSITIVE_INFINITY
        if (tempA !== tempB) return tempA - tempB
        const speedA = a.speed > 0 ? a.speed : Number.POSITIVE_INFINITY
        const speedB = b.speed > 0 ? b.speed : Number.POSITIVE_INFINITY
        return speedA - speedB
      }),
    [profilesWithData],
  )
  const profileOptions = useMemo(
    () =>
      orderedProfiles.map((profile) => ({
        value: profile.profile,
        label: `${formatProfileLabel(profile.temperature, profile.speed)} · ${profile.tests} ensaios`,
      })),
    [orderedProfiles],
  )

  const [leftRunId, setLeftRunId] = useState<string | undefined>(runOptions[0]?.value)
  const [rightRunId, setRightRunId] = useState<string | undefined>(runOptions[1]?.value)
  const [leftProfileId, setLeftProfileId] = useState<string | undefined>(profileOptions[0]?.value)
  const [rightProfileId, setRightProfileId] = useState<string | undefined>(profileOptions[1]?.value)

  const selectedLeftRun = orderedRuns.find((run) => String(run.id) === leftRunId)
  const selectedRightRun = orderedRuns.find((run) => String(run.id) === rightRunId)
  const selectedLeftProfile = orderedProfiles.find((profile) => profile.profile === leftProfileId)
  const selectedRightProfile = orderedProfiles.find((profile) => profile.profile === rightProfileId)

  return (
    <Tabs defaultValue="individual">
      <TabsList>
        <TabsTrigger value="individual">Ensaios individuais</TabsTrigger>
        <TabsTrigger value="average">Médias por perfil</TabsTrigger>
      </TabsList>

      <TabsContent value="individual" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleção de ensaios</CardTitle>
            <CardDescription>Escolha manualmente dois ensaios para comparar.</CardDescription>
          </CardHeader>
          <CardContent>
            {runOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ensaio disponível para comparação.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="run-left">Ensaio 1</Label>
                  <Select value={leftRunId} onValueChange={setLeftRunId}>
                    <SelectTrigger id="run-left" className="w-full">
                      <SelectValue placeholder="Selecione um ensaio" />
                    </SelectTrigger>
                    <SelectContent>
                      {runOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.value === rightRunId}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="run-right">Ensaio 2</Label>
                  <Select value={rightRunId} onValueChange={setRightRunId}>
                    <SelectTrigger id="run-right" className="w-full">
                      <SelectValue placeholder="Selecione um ensaio" />
                    </SelectTrigger>
                    <SelectContent>
                      {runOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.value === leftRunId}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedLeftRun && selectedRightRun ? (
          <RunComparison left={selectedLeftRun} right={selectedRightRun} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Selecione dois ensaios para visualizar a comparação detalhada.
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="average" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleção de perfis</CardTitle>
            <CardDescription>Compare médias de tensão e deformação por perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            {profileOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum perfil com dados suficientes para comparar.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-left">Perfil 1</Label>
                  <Select value={leftProfileId} onValueChange={setLeftProfileId}>
                    <SelectTrigger id="profile-left" className="w-full">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profileOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.value === rightProfileId}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-right">Perfil 2</Label>
                  <Select value={rightProfileId} onValueChange={setRightProfileId}>
                    <SelectTrigger id="profile-right" className="w-full">
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {profileOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.value === leftProfileId}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedLeftProfile && selectedRightProfile ? (
          <AverageComparison left={selectedLeftProfile} right={selectedRightProfile} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Selecione dois perfis para visualizar a comparação de médias.
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

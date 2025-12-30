"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StressStrainChart } from "@/components/charts/stress-strain-chart"
import { StressStrainValidationChart } from "@/components/charts/stress-strain-validation-chart"
import { RambergOsgoodLinearizationChart } from "@/components/charts/ramberg-osgood-linearization-chart"
import { ResponseSurfaceChart } from "@/components/charts/response-surface-chart"
import type { PredictionResult, RambergOsgoodTrainingPoint } from "@/types"
import { formatProfileLabel } from "@/lib/formatters"
import { BarChart3, LineChart, Box, Zap, Target, Percent, Battery, Shield, CheckCircle2 } from "lucide-react"

type ResultsDisplayProps = {
  result: PredictionResult | null
  trainingData: RambergOsgoodTrainingPoint[]
}

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const stressFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

export function ResultsDisplay({ result, trainingData }: ResultsDisplayProps) {
  const params = result?.rambergOsgood
  const properties = result?.properties
  const validationProfile = useMemo(() => {
    if (!result || !trainingData.length) return null

    const exact = trainingData.find(
      (profile) =>
        profile.temperature === result.input.temperature && profile.speed === result.input.speed,
    )
    if (exact) {
      return { profile: exact, isExact: true }
    }

    let closest = trainingData[0]
    let closestDistance = Number.POSITIVE_INFINITY

    for (const profile of trainingData) {
      const dx = profile.temperature - result.input.temperature
      const dy = profile.speed - result.input.speed
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < closestDistance) {
        closestDistance = distance
        closest = profile
      }
    }

    return { profile: closest, isExact: false }
  }, [result, trainingData])
  const validationPoints = validationProfile?.profile.validationPoints ?? []

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Resultados da Previsão</CardTitle>
        <CardDescription>Propriedades mecânicas e visualizações gráficas</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-11">
            <TabsTrigger value="properties" className="gap-2 text-xs sm:text-sm">
              <BarChart3 className="size-4 hidden sm:block" />
              Propriedades
            </TabsTrigger>
            <TabsTrigger value="curve" className="gap-2 text-xs sm:text-sm">
              <LineChart className="size-4 hidden sm:block" />
              Curva σ-ε
            </TabsTrigger>
            <TabsTrigger value="surfaces" className="gap-2 text-xs sm:text-sm">
              <Box className="size-4 hidden sm:block" />
              Superfícies 3D
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="size-4 hidden sm:block" />
              Validação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4 mt-4">

            <div className="rounded-xl border border-foreground/20 bg-white p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/10">
                  <Zap className="size-4 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Parâmetros Ramberg-Osgood</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                ε = σ/E + 0,002 · (σ/σ₀)<sup>n</sup>
                {result ? " · Interpolação por base radial nos ensaios reais." : ""}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
                  <span className="text-sm text-muted-foreground">E (Módulo de Elasticidade)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {params ? `${numberFormatter.format(params.E)} MPa` : "-- MPa"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
                  <span className="text-sm text-muted-foreground">σ₀ (Tensão de Referência)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {params ? `${stressFormatter.format(params.sigma_0)} MPa` : "-- MPa"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
                  <span className="text-sm text-muted-foreground">n (Expoente de Encruamento)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {params ? numberFormatter.format(params.n) : "--"}
                  </span>
                </div>
              </div>
            </div>


            <div className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Target className="size-4 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Propriedades Mecânicas</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <Shield className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tensão de Escoamento</p>
                    <p className="font-mono font-semibold">
                      {properties ? `${stressFormatter.format(properties.yieldStress)} MPa` : "-- MPa"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <Zap className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tensão Máxima</p>
                    <p className="font-mono font-semibold">
                      {properties ? `${stressFormatter.format(properties.ultimateStress)} MPa` : "-- MPa"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <Percent className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Ductilidade</p>
                    <p className="font-mono font-semibold">
                      {properties ? `${numberFormatter.format(properties.ductility)}%` : "--%"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <Battery className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Resiliência</p>
                    <p className="font-mono font-semibold">
                      {properties ? `${numberFormatter.format(properties.resilience)} MJ/m³` : "-- MJ/m³"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                <Target className="size-4 text-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Tenacidade</p>
                  <p className="font-mono font-semibold">
                    {properties ? `${numberFormatter.format(properties.toughness)} MJ/m³` : "-- MJ/m³"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curve" className="mt-4">
            <div className="rounded-xl border border-border p-4">
              <StressStrainChart curve={result?.curve ?? []} />
            </div>
          </TabsContent>

          <TabsContent value="surfaces" className="mt-4">
            <div className="rounded-xl border border-border p-4">
              <ResponseSurfaceChart />
            </div>
          </TabsContent>

          <TabsContent value="validation" className="mt-4 space-y-4">
            {!result ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Gere uma previsão para validar a curva com pontos reais.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-border bg-white p-4 text-xs text-muted-foreground">
                  {validationProfile ? (
                    <p>
                      {validationProfile.isExact
                        ? "Comparação com dados reais na mesma condição."
                        : `Comparação com o perfil real mais próximo: ${formatProfileLabel(
                            validationProfile.profile.temperature,
                            validationProfile.profile.speed,
                          )}.`}
                      {validationPoints.length ? ` (${validationPoints.length} pontos amostrados)` : ""}
                    </p>
                  ) : (
                    <p>Nenhum conjunto real disponível para validação.</p>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Curva prevista × pontos reais
                    </h3>
                    <StressStrainValidationChart curve={result.curve} points={validationPoints} />
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Linearização Ramberg-Osgood (log‑log)
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      εp = ε − σ/E. Se o modelo é adequado, os pontos reais se alinham em uma reta nesta escala.
                    </p>
                    <RambergOsgoodLinearizationChart points={validationPoints} />
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

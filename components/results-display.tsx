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
import {
  BarChart3,
  LineChart,
  Box,
  Zap,
  Target,
  Percent,
  Battery,
  Shield,
  CheckCircle2,
  Thermometer,
  Database,
} from "lucide-react"

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
  const diagnostics = useMemo(() => {
    if (!result || !trainingData.length) return null

    const temperatures = trainingData.map((point) => point.temperature)
    const speeds = trainingData.map((point) => point.speed)
    const tempMin = Math.min(...temperatures)
    const tempMax = Math.max(...temperatures)
    const speedMin = Math.min(...speeds)
    const speedMax = Math.max(...speeds)
    const nearestProfile = validationProfile?.profile ?? trainingData[0]
    const tempRange = tempMax - tempMin || 1
    const speedRange = speedMax - speedMin || 1
    const dx = (result.input.temperature - nearestProfile.temperature) / tempRange
    const dy = (result.input.speed - nearestProfile.speed) / speedRange
    const normalizedDistance = Math.min(Math.sqrt(dx * dx + dy * dy) / Math.sqrt(2), 1)
    const confidence =
      normalizedDistance < 0.2 ? "Alta" : normalizedDistance < 0.45 ? "Moderada" : "Baixa"
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
  }, [result, trainingData, validationProfile])
  const maxStrain = result?.curve?.length ? result.curve[result.curve.length - 1].strain : null
  const methodLabel = result
    ? result.interpolationMethod === "rbf"
      ? "RBF Gaussiana"
      : "Polinomial"
    : "--"
  const confidenceClass = diagnostics
    ? diagnostics.confidence === "Alta"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : diagnostics.confidence === "Moderada"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700"
    : "border-border bg-muted text-muted-foreground"

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
              Resumo técnico
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
            {!result ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                Gere uma previsão para visualizar os indicadores técnicos.
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/10">
                  <Database className="size-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Resumo técnico da simulação</h3>
                  <p className="text-xs text-muted-foreground">
                    Entrada, base experimental e confiabilidade da interpolação.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-lg border border-border bg-white px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Thermometer className="size-4 text-foreground" />
                    Entrada
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Temperatura</span>
                      <span className="font-mono font-semibold text-foreground">
                        {result ? `${result.input.temperature}°C` : "--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Velocidade</span>
                      <span className="font-mono font-semibold text-foreground">
                        {result ? `${result.input.speed} mm/s` : "--"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-white px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Database className="size-4 text-foreground" />
                    Modelo e base
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Método</span>
                      <span className="font-mono font-semibold text-foreground">{methodLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Perfis reais</span>
                      <span className="font-mono font-semibold text-foreground">
                        {trainingData.length || "--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Faixa ensaiada</span>
                      <span className="font-mono font-semibold text-foreground">
                        {diagnostics
                          ? `${diagnostics.tempMin}–${diagnostics.tempMax}°C`
                          : "--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Velocidade</span>
                      <span className="font-mono font-semibold text-foreground">
                        {diagnostics
                          ? `${diagnostics.speedMin}–${diagnostics.speedMax} mm/s`
                          : "--"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-white px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="size-4 text-foreground" />
                    Confiabilidade
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Proximidade</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${confidenceClass}`}>
                        {diagnostics?.confidence ?? "--"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {diagnostics
                        ? diagnostics.withinBounds
                          ? "Entrada dentro do envelope experimental."
                          : "Entrada fora da faixa observada nos ensaios."
                        : "Sem dados suficientes para avaliar a proximidade."}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Perfil de referência</span>
                      <span className="font-medium text-foreground">
                        {diagnostics
                          ? formatProfileLabel(
                              diagnostics.nearestProfile.temperature,
                              diagnostics.nearestProfile.speed,
                            )
                          : "--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Distância normalizada</span>
                      <span className="font-mono font-semibold text-foreground">
                        {diagnostics ? strainFormatter.format(diagnostics.normalizedDistance) : "--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Pontos no ajuste</span>
                      <span className="font-mono font-semibold text-foreground">
                        {diagnostics ? diagnostics.nearestProfile.pointsUsed : "--"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">RMSE (deformação)</span>
                      <span className="font-mono font-semibold text-foreground">
                        {diagnostics ? strainFormatter.format(diagnostics.nearestProfile.rmse) : "--"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-foreground/20 bg-white p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/10">
                  <Zap className="size-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Parâmetros Ramberg-Osgood</h3>
                  <p className="text-xs text-muted-foreground">
                    Modelo calibrado com 0,2% offset e interpolação por base radial.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">E</p>
                    <p className="text-xs text-muted-foreground">Módulo de elasticidade (rigidez inicial).</p>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {params ? `${numberFormatter.format(params.E)} MPa` : "-- MPa"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">σ₀</p>
                    <p className="text-xs text-muted-foreground">Tensão de referência (0,2% offset).</p>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {params ? `${stressFormatter.format(params.sigma_0)} MPa` : "-- MPa"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">n</p>
                    <p className="text-xs text-muted-foreground">Expoente de encruamento.</p>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {params ? numberFormatter.format(params.n) : "--"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Deformação limite</p>
                    <p className="text-xs text-muted-foreground">Máxima deformação observada nos ensaios.</p>
                  </div>
                  <span className="font-mono font-semibold text-foreground">
                    {maxStrain !== null ? `${numberFormatter.format(maxStrain * 100)}%` : "--"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Target className="size-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Propriedades Mecânicas</h3>
                  <p className="text-xs text-muted-foreground">
                    Indicadores calculados diretamente a partir do modelo ajustado.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <Shield className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tensão de Escoamento (0,2%)</p>
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
              <p className="mt-3 text-xs text-muted-foreground">
                Resiliência considera a energia até o escoamento. Tenacidade considera a energia total.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="curve" className="mt-4">
            <div className="rounded-xl border border-border p-4">
              <StressStrainChart curve={result?.curve ?? []} />
            </div>
          </TabsContent>

          <TabsContent value="surfaces" className="mt-4">
            <div className="rounded-xl border border-border p-4 bg-white">
              <ResponseSurfaceChart trainingData={trainingData} result={result} />
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
                      A deformação plástica é obtida removendo a parcela elástica. Em escala log‑log, um bom ajuste
                      tende a alinhar os pontos reais em uma reta.
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

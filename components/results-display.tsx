"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StressStrainChart } from "@/components/charts/stress-strain-chart"
import { ResponseSurfaceChart } from "@/components/charts/response-surface-chart"
import { BarChart3, LineChart, Box, Zap, Target, Percent, Battery, Shield } from "lucide-react"

export function ResultsDisplay() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Resultados da Previsão</CardTitle>
        <CardDescription>Propriedades mecânicas e visualizações gráficas</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-11">
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
          </TabsList>

          <TabsContent value="properties" className="space-y-4 mt-4">
            {/* Ramberg-Osgood Parameters */}
            <div className="rounded-xl border border-foreground/20 bg-gradient-to-br from-foreground/5 to-foreground/10 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground/10">
                  <Zap className="size-4 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Parâmetros Ramberg-Osgood</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-card/80 px-4 py-3">
                  <span className="text-sm text-muted-foreground">E (Módulo de Elasticidade)</span>
                  <span className="font-mono font-semibold text-foreground">-- MPa</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-card/80 px-4 py-3">
                  <span className="text-sm text-muted-foreground">σ₀ (Tensão de Referência)</span>
                  <span className="font-mono font-semibold text-foreground">-- MPa</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-card/80 px-4 py-3">
                  <span className="text-sm text-muted-foreground">n (Expoente de Encruamento)</span>
                  <span className="font-mono font-semibold text-foreground">--</span>
                </div>
              </div>
            </div>

            {/* Mechanical Properties */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                  <Target className="size-4 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">Propriedades Mecânicas</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                  <Shield className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tensão de Escoamento</p>
                    <p className="font-mono font-semibold">-- MPa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                  <Zap className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tensão Máxima</p>
                    <p className="font-mono font-semibold">-- MPa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                  <Percent className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Ductilidade</p>
                    <p className="font-mono font-semibold">--%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                  <Battery className="size-4 text-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Resiliência</p>
                    <p className="font-mono font-semibold">-- MJ/m³</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                <Target className="size-4 text-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Tenacidade</p>
                  <p className="font-mono font-semibold">-- MJ/m³</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curve" className="mt-4">
            <div className="rounded-xl border border-border p-4">
              <StressStrainChart />
            </div>
          </TabsContent>

          <TabsContent value="surfaces" className="mt-4">
            <div className="rounded-xl border border-border p-4">
              <ResponseSurfaceChart />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

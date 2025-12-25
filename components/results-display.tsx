"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StressStrainChart } from "@/components/charts/stress-strain-chart"
import { ResponseSurfaceChart } from "@/components/charts/response-surface-chart"

export function ResultsDisplay() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados da Previsão</CardTitle>
        <CardDescription>Propriedades mecânicas e visualizações</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Propriedades</TabsTrigger>
            <TabsTrigger value="curve">Curva σ-ε</TabsTrigger>
            <TabsTrigger value="surfaces">Superfícies 3D</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-semibold mb-3">Parâmetros Ramberg-Osgood</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E (Módulo de Elasticidade):</span>
                  <span className="font-mono">-- MPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">σ₀ (Tensão de Referência):</span>
                  <span className="font-mono">-- MPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">n (Expoente de Encruamento):</span>
                  <span className="font-mono">--</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="font-semibold mb-3">Propriedades Mecânicas</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tensão de Escoamento:</span>
                  <span className="font-mono">-- MPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tensão Máxima:</span>
                  <span className="font-mono">-- MPa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ductilidade:</span>
                  <span className="font-mono">--%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resiliência:</span>
                  <span className="font-mono">-- MJ/m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenacidade:</span>
                  <span className="font-mono">-- MJ/m³</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curve">
            <StressStrainChart />
          </TabsContent>

          <TabsContent value="surfaces">
            <ResponseSurfaceChart />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

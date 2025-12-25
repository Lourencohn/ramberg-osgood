import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

const comparisonData = [
  {
    id: "SIM-001",
    temperature: 210,
    speed: 45,
    tensileStrength: 52.3,
    youngModulus: 3421,
    elongation: 4.2,
  },
  {
    id: "SIM-003",
    temperature: 205,
    speed: 40,
    tensileStrength: 54.1,
    youngModulus: 3528,
    elongation: 4.5,
  },
]

export default function ComparePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Análise Comparativa</h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Compare resultados de diferentes simulações lado a lado
            </p>
          </div>
          <Button>
            <Plus className="mr-2 size-4" />
            Adicionar Simulação
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {comparisonData.map((sim, index) => (
            <Card key={sim.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Simulação {index + 1}</Badge>
                    <span className="font-mono text-sm font-medium">{sim.id}</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <X className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm text-muted-foreground">Temperatura</span>
                    <span className="font-medium">{sim.temperature}°C</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm text-muted-foreground">Velocidade</span>
                    <span className="font-medium">{sim.speed} mm/s</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="text-sm font-medium">Propriedades Mecânicas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Resistência à Tração</span>
                      <span className="font-medium">{sim.tensileStrength} MPa</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Módulo de Young</span>
                      <span className="font-medium">{sim.youngModulus} MPa</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Alongamento</span>
                      <span className="font-medium">{sim.elongation}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {comparisonData.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Diferenças Relativas</CardTitle>
              <CardDescription>Comparação percentual entre as simulações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="text-sm font-medium">Resistência à Tração</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      +{((comparisonData[1].tensileStrength / comparisonData[0].tensileStrength - 1) * 100).toFixed(1)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">maior na Sim 2</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="text-sm font-medium">Módulo de Young</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      +{((comparisonData[1].youngModulus / comparisonData[0].youngModulus - 1) * 100).toFixed(1)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">maior na Sim 2</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <span className="text-sm font-medium">Alongamento</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      +{((comparisonData[1].elongation / comparisonData[0].elongation - 1) * 100).toFixed(1)}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">maior na Sim 2</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

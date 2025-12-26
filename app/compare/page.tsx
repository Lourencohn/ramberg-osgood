import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Thermometer, Gauge, TrendingUp, ArrowUpRight, ArrowDownRight, Equal, GitCompare } from "lucide-react"

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

function getDifferenceInfo(val1: number, val2: number) {
  const diff = ((val2 / val1 - 1) * 100)
  const isPositive = diff > 0
  const isEqual = Math.abs(diff) < 0.1
  return {
    value: Math.abs(diff).toFixed(1),
    isPositive,
    isEqual,
    label: isEqual ? "igual" : isPositive ? "maior" : "menor"
  }
}

export default function ComparePage() {
  const tensileInfo = getDifferenceInfo(comparisonData[0].tensileStrength, comparisonData[1].tensileStrength)
  const youngInfo = getDifferenceInfo(comparisonData[0].youngModulus, comparisonData[1].youngModulus)
  const elongationInfo = getDifferenceInfo(comparisonData[0].elongation, comparisonData[1].elongation)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Análise Comparativa</h1>
            <p className="mt-1.5 text-muted-foreground">
              Compare resultados de diferentes simulações lado a lado
            </p>
          </div>
          <Button className="gap-2 shadow-sm">
            <Plus className="size-4" />
            Adicionar Simulação
          </Button>
        </div>

        {/* Comparison Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {comparisonData.map((sim, index) => (
            <Card key={sim.id} className="relative overflow-hidden">
              {/* Color indicator */}
              <div className={`absolute left-0 top-0 h-full w-1 ${index === 0 ? "bg-foreground" : "bg-foreground/50"}`} />

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`font-semibold ${index === 0 ? "border-foreground/50 text-foreground" : "border-foreground/30 text-foreground/70"}`}
                    >
                      Simulação {index + 1}
                    </Badge>
                    <span className="inline-flex items-center rounded-md bg-foreground text-background px-2.5 py-1 font-mono text-sm font-semibold">
                      {sim.id}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-foreground/10 hover:text-foreground">
                    <X className="size-4" />
                    <span className="sr-only">Remover</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Parameters */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                      <Thermometer className="size-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Temperatura</p>
                      <p className="text-lg font-bold">{sim.temperature}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                      <Gauge className="size-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Velocidade</p>
                      <p className="text-lg font-bold">{sim.speed} mm/s</p>
                    </div>
                  </div>
                </div>

                {/* Mechanical Properties */}
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-foreground">Propriedades Mecânicas</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Resistência à Tração (σ)</span>
                      <span className="text-sm font-bold text-foreground">{sim.tensileStrength} MPa</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Módulo de Young (E)</span>
                      <span className="text-sm font-bold text-foreground">{sim.youngModulus} MPa</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Alongamento (ε)</span>
                      <span className="text-sm font-bold text-foreground">{sim.elongation}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Differences Card */}
        {comparisonData.length >= 2 && (
          <Card className="bg-gradient-to-br from-muted/30 to-muted/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                  <GitCompare className="size-5 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Diferenças Relativas</CardTitle>
                  <CardDescription>Comparação percentual: Simulação 2 em relação à Simulação 1</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Tensile Strength */}
                <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                  <p className="text-sm text-muted-foreground">Resistência à Tração</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                      tensileInfo.isPositive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}>
                      {tensileInfo.isPositive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      {tensileInfo.value}%
                    </div>
                    <span className="text-xs text-muted-foreground">{tensileInfo.label}</span>
                  </div>
                </div>

                {/* Young Modulus */}
                <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                  <p className="text-sm text-muted-foreground">Módulo de Young</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                      youngInfo.isPositive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}>
                      {youngInfo.isPositive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      {youngInfo.value}%
                    </div>
                    <span className="text-xs text-muted-foreground">{youngInfo.label}</span>
                  </div>
                </div>

                {/* Elongation */}
                <div className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                  <p className="text-sm text-muted-foreground">Alongamento</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                      elongationInfo.isPositive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}>
                      {elongationInfo.isPositive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      {elongationInfo.value}%
                    </div>
                    <span className="text-xs text-muted-foreground">{elongationInfo.label}</span>
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

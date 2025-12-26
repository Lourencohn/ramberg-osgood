import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, Trash2, Eye, Filter, Thermometer, Gauge, CheckCircle2, Calendar, FileSpreadsheet } from "lucide-react"

const simulationHistory = [
  {
    id: "SIM-001",
    date: "2024-01-15 14:23",
    temperature: 210,
    speed: 45,
    tensileStrength: 52.3,
    youngModulus: 3421,
    elongation: 4.2,
    status: "Concluído",
  },
  {
    id: "SIM-002",
    date: "2024-01-15 12:10",
    temperature: 215,
    speed: 50,
    tensileStrength: 49.8,
    youngModulus: 3312,
    elongation: 3.9,
    status: "Concluído",
  },
  {
    id: "SIM-003",
    date: "2024-01-14 16:45",
    temperature: 205,
    speed: 40,
    tensileStrength: 54.1,
    youngModulus: 3528,
    elongation: 4.5,
    status: "Concluído",
  },
  {
    id: "SIM-004",
    date: "2024-01-14 09:30",
    temperature: 220,
    speed: 55,
    tensileStrength: 47.2,
    youngModulus: 3198,
    elongation: 3.6,
    status: "Concluído",
  },
  {
    id: "SIM-005",
    date: "2024-01-13 15:20",
    temperature: 200,
    speed: 35,
    tensileStrength: 55.6,
    youngModulus: 3612,
    elongation: 4.8,
    status: "Concluído",
  },
]

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Histórico de Simulações</h1>
            <p className="mt-1.5 text-muted-foreground">
              Gerencie e exporte todas as predições realizadas
            </p>
          </div>
          <Button className="gap-2 shadow-sm">
            <FileSpreadsheet className="size-4" />
            Exportar Tudo
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-foreground to-foreground/90 text-background border-foreground">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-background/20">
                  <FileSpreadsheet className="size-5 text-background" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-background">{simulationHistory.length}</p>
                  <p className="text-xs text-background/70">Total de Simulações</p>
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
                  <p className="text-2xl font-bold">{simulationHistory.length}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
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
                  <p className="text-2xl font-bold">Hoje</p>
                  <p className="text-xs text-muted-foreground">Última simulação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, temperatura ou velocidade..."
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
            <div className="space-y-3">
              {simulationHistory.map((sim) => (
                <div
                  key={sim.id}
                  className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 space-y-3">
                    {/* ID and Status Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-foreground text-background px-2.5 py-1 font-mono text-sm font-semibold">
                        {sim.id}
                      </span>
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <CheckCircle2 className="size-3 text-foreground" />
                        {sim.status}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {sim.date}
                      </span>
                    </div>

                    {/* Parameters Row */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                        <Thermometer className="size-4 text-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Temp:</span>{" "}
                          <span className="font-semibold">{sim.temperature}°C</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                        <Gauge className="size-4 text-foreground" />
                        <span className="text-sm">
                          <span className="text-muted-foreground">Vel:</span>{" "}
                          <span className="font-semibold">{sim.speed}mm/s</span>
                        </span>
                      </div>
                    </div>

                    {/* Results Row */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">σ:</span>
                        <span className="font-semibold text-foreground">{sim.tensileStrength} MPa</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">E:</span>
                        <span className="font-semibold text-foreground">{sim.youngModulus} MPa</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">ε:</span>
                        <span className="font-semibold text-foreground">{sim.elongation}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 sm:gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-foreground/10 hover:text-foreground">
                      <Eye className="size-4" />
                      <span className="sr-only">Visualizar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-foreground/10 hover:text-foreground">
                      <Download className="size-4" />
                      <span className="sr-only">Baixar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-foreground/10 hover:text-foreground">
                      <Trash2 className="size-4" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

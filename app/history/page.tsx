import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, Trash2, Eye } from "lucide-react"

const simulationHistory = [
  {
    id: "SIM-001",
    date: "2024-01-15 14:23",
    temperature: 210,
    speed: 45,
    tensileStrength: 52.3,
    youngModulus: 3421,
    elongation: 4.2,
    status: "completed",
  },
  {
    id: "SIM-002",
    date: "2024-01-15 12:10",
    temperature: 215,
    speed: 50,
    tensileStrength: 49.8,
    youngModulus: 3312,
    elongation: 3.9,
    status: "completed",
  },
  {
    id: "SIM-003",
    date: "2024-01-14 16:45",
    temperature: 205,
    speed: 40,
    tensileStrength: 54.1,
    youngModulus: 3528,
    elongation: 4.5,
    status: "completed",
  },
  {
    id: "SIM-004",
    date: "2024-01-14 09:30",
    temperature: 220,
    speed: 55,
    tensileStrength: 47.2,
    youngModulus: 3198,
    elongation: 3.6,
    status: "completed",
  },
  {
    id: "SIM-005",
    date: "2024-01-13 15:20",
    temperature: 200,
    speed: 35,
    tensileStrength: 55.6,
    youngModulus: 3612,
    elongation: 4.8,
    status: "completed",
  },
]

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Histórico de Simulações</h1>
            <p className="mt-2 text-muted-foreground text-pretty">Visualize e gerencie todas as predições realizadas</p>
          </div>
          <Button>
            <Download className="mr-2 size-4" />
            Exportar Tudo
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar simulações..." className="pl-9" />
              </div>
              <Button variant="outline">Filtrar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {simulationHistory.map((sim) => (
                <div
                  key={sim.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">{sim.id}</span>
                      <Badge variant="secondary">{sim.status}</Badge>
                      <span className="text-xs text-muted-foreground">{sim.date}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Temperatura:</span>
                        <span className="ml-1 font-medium">{sim.temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Velocidade:</span>
                        <span className="ml-1 font-medium">{sim.speed}mm/s</span>
                      </div>
                    </div>
                    <div className="flex gap-6 text-xs text-muted-foreground">
                      <span>σ: {sim.tensileStrength} MPa</span>
                      <span>E: {sim.youngModulus} MPa</span>
                      <span>ε: {sim.elongation}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="size-4" />
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

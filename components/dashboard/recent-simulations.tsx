import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Thermometer, Gauge, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const recentSimulations = [
  {
    id: "1",
    temperature: 210,
    speed: 45,
    tensileStrength: 52.3,
    youngModulus: 3421,
    date: "2024-01-15 14:23",
    status: "Concluído",
  },
  {
    id: "2",
    temperature: 215,
    speed: 50,
    tensileStrength: 49.8,
    youngModulus: 3312,
    date: "2024-01-15 12:10",
    status: "Concluído",
  },
  {
    id: "3",
    temperature: 205,
    speed: 40,
    tensileStrength: 54.1,
    youngModulus: 3528,
    date: "2024-01-14 16:45",
    status: "Concluído",
  },
  {
    id: "4",
    temperature: 220,
    speed: 55,
    tensileStrength: 47.2,
    youngModulus: 3198,
    date: "2024-01-14 09:30",
    status: "Concluído",
  },
]

export function RecentSimulations() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Simulações Recentes</CardTitle>
            <CardDescription>Últimas predições realizadas</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/history">
              Ver todas
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3">
          {recentSimulations.map((sim) => (
            <div
              key={sim.id}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Thermometer className="size-3.5 text-foreground" />
                    <span>{sim.temperature}°C</span>
                  </div>
                  <span className="text-muted-foreground">/</span>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Gauge className="size-3.5 text-foreground" />
                    <span>{sim.speed}mm/s</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 gap-1 text-xs font-normal">
                    <CheckCircle2 className="size-3 text-foreground" />
                    {sim.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sim.date}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  <span className="text-muted-foreground font-normal">σ:</span> {sim.tensileStrength} MPa
                </p>
                <p className="text-xs text-muted-foreground">
                  <span>E:</span> {sim.youngModulus} MPa
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

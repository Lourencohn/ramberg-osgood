import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const recentSimulations = [
  {
    id: "1",
    temperature: 210,
    speed: 45,
    tensileStrength: 52.3,
    youngModulus: 3421,
    date: "2024-01-15 14:23",
    status: "completed",
  },
  {
    id: "2",
    temperature: 215,
    speed: 50,
    tensileStrength: 49.8,
    youngModulus: 3312,
    date: "2024-01-15 12:10",
    status: "completed",
  },
  {
    id: "3",
    temperature: 205,
    speed: 40,
    tensileStrength: 54.1,
    youngModulus: 3528,
    date: "2024-01-14 16:45",
    status: "completed",
  },
  {
    id: "4",
    temperature: 220,
    speed: 55,
    tensileStrength: 47.2,
    youngModulus: 3198,
    date: "2024-01-14 09:30",
    status: "completed",
  },
]

export function RecentSimulations() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Simulações Recentes</CardTitle>
            <CardDescription>Últimas predições realizadas no sistema</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history">
              Ver todas
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentSimulations.map((sim) => (
            <div key={sim.id} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {sim.temperature}°C / {sim.speed}mm/s
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {sim.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sim.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">σ: {sim.tensileStrength} MPa</p>
                <p className="text-xs text-muted-foreground">E: {sim.youngModulus} MPa</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

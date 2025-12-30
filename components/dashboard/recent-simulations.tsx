import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { RunMetrics } from "@/lib/dashboard-data"
import { ArrowRight, Thermometer, Gauge, CheckCircle2, FileText } from "lucide-react"
import Link from "next/link"

type RecentSimulationsProps = {
  runs: RunMetrics[]
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function RecentSimulations({ runs }: RecentSimulationsProps) {
  const hasData = runs.length > 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Simulações Recentes</CardTitle>
            <CardDescription>Últimos ensaios importados do banco real</CardDescription>
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
        {!hasData ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nenhum ensaio encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div
                key={run.id}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Thermometer className="size-3.5 text-foreground" />
                      <span>{run.temperature}°C</span>
                    </div>
                    <span className="text-muted-foreground">/</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Gauge className="size-3.5 text-foreground" />
                      <span>{run.speed}mm/s</span>
                    </div>
                    <Badge variant="secondary" className="ml-2 gap-1 text-xs font-normal">
                      <CheckCircle2 className="size-3 text-foreground" />
                      {run.testCode}
                    </Badge>
                    {run.source ? (
                      <Badge variant="outline" className="gap-1 text-[11px] font-normal">
                        <FileText className="size-3" />
                        {run.source}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(run.createdAt))}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    <span className="text-muted-foreground font-normal">σ:</span>{" "}
                    {run.maxStress !== null ? `${numberFormatter.format(run.maxStress)} MPa` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-muted-foreground">ε:</span>{" "}
                    {run.maxStrain !== null ? `${numberFormatter.format(run.maxStrain)} mm/mm` : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

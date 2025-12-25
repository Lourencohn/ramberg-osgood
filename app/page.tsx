import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentSimulations } from "@/components/dashboard/recent-simulations"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { SimulationsTrendChart } from "@/components/dashboard/simulations-trend-chart"
import { PropertiesDistributionChart } from "@/components/dashboard/properties-distribution-chart"
import { ParametersUsageChart } from "@/components/dashboard/parameters-usage-chart"
import { PerformanceComparisonChart } from "@/components/dashboard/performance-comparison-chart"
import { Activity, Beaker, Baseline as ChartLine, History } from "lucide-react"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Visão geral do sistema de predição de propriedades mecânicas para PLA
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Simulações Total"
            value="147"
            icon={<Activity className="size-5 text-muted-foreground" />}
            trend={{ value: 12, label: "vs. mês anterior" }}
          />
          <StatsCard
            title="Última Simulação"
            value="2h atrás"
            icon={<History className="size-5 text-muted-foreground" />}
            description="210°C / 45mm/s"
          />
          <StatsCard
            title="Parâmetros Salvos"
            value="23"
            icon={<Beaker className="size-5 text-muted-foreground" />}
            trend={{ value: 3, label: "novos esta semana" }}
          />
          <StatsCard
            title="Análises Comparativas"
            value="8"
            icon={<ChartLine className="size-5 text-muted-foreground" />}
            description="comparações ativas"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SimulationsTrendChart />
          <ParametersUsageChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <PropertiesDistributionChart />
          <PerformanceComparisonChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentSimulations />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

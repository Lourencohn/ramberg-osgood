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
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de predição de propriedades mecânicas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Simulações"
            value="147"
            icon={<Activity className="size-5 text-background" />}
            trend={{ value: 12, label: "vs. mês anterior" }}
            variant="primary"
          />
          <StatsCard
            title="Última Simulação"
            value="2h atrás"
            icon={<History className="size-5 text-foreground" />}
            description="210°C / 45mm/s"
          />
          <StatsCard
            title="Parâmetros Salvos"
            value="23"
            icon={<Beaker className="size-5 text-foreground" />}
            trend={{ value: 3, label: "novos esta semana" }}
          />
          <StatsCard
            title="Comparações Ativas"
            value="8"
            icon={<ChartLine className="size-5 text-foreground" />}
            description="análises em andamento"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SimulationsTrendChart />
          <ParametersUsageChart />
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PropertiesDistributionChart />
          <PerformanceComparisonChart />
        </div>

        {/* Recent & Quick Actions */}
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

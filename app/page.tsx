import { format } from "date-fns"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentSimulations } from "@/components/dashboard/recent-simulations"
import { SimulationsTrendChart } from "@/components/dashboard/simulations-trend-chart"
import { PropertiesDistributionChart } from "@/components/dashboard/properties-distribution-chart"
import { ParametersUsageChart } from "@/components/dashboard/parameters-usage-chart"
import { PerformanceComparisonChart } from "@/components/dashboard/performance-comparison-chart"
import { ProfileTests } from "@/components/dashboard/profile-tests"
import { Activity, Beaker, Baseline as ChartLine, History } from "lucide-react"
import { getDashboardData } from "@/lib/dashboard-data"

export const dynamic = "force-dynamic"

export default async function Home() {
  const dashboardData = await getDashboardData()
  const {
    stats,
    profileAverages,
    temperatureUsage,
    stressDistribution,
    speedPerformance,
    recentRuns,
    profileDetails,
  } = dashboardData

  const numberFormatter = new Intl.NumberFormat("pt-BR")
  const avgPoints = stats.totalTests ? Math.round(stats.totalMeasurements / stats.totalTests) : 0
  const stressShare = stats.totalTests ? Math.round((stats.testsWithStress / stats.totalTests) * 100) : 0
  const lastTestValue = stats.lastTest ? format(new Date(stats.lastTest.createdAt), "dd/MM/yyyy HH:mm") : "—"
  const lastTestDescription = stats.lastTest
    ? `${stats.lastTest.profileCode} • ${stats.lastTest.temperature}°C / ${stats.lastTest.speed}mm/s`
    : "Nenhum ensaio registrado"

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de predição de propriedades mecânicas
          </p>
        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Ensaios registrados"
            value={numberFormatter.format(stats.totalTests)}
            icon={<Activity className="size-5 text-background" />}
            trend={{ value: stressShare, label: "com tensão calculada" }}
            variant="primary"
          />
          <StatsCard
            title="Última Simulação"
            value={lastTestValue}
            icon={<History className="size-5 text-foreground" />}
            description={lastTestDescription}
          />
          <StatsCard
            title="Perfis de Impressão"
            value={numberFormatter.format(stats.totalProfiles)}
            icon={<Beaker className="size-5 text-foreground" />}
            description="Combinações de temperatura/velocidade"
          />
          <StatsCard
            title="Pontos Medidos"
            value={numberFormatter.format(stats.totalMeasurements)}
            icon={<ChartLine className="size-5 text-foreground" />}
            description={`~${numberFormatter.format(avgPoints)} pontos por ensaio`}
          />
        </div>


        <div className="grid gap-6 lg:grid-cols-2">
          <SimulationsTrendChart data={profileAverages} />
          <ParametersUsageChart data={temperatureUsage} />
        </div>


        <div className="grid gap-6 lg:grid-cols-2">
          <PropertiesDistributionChart data={stressDistribution} />
          <PerformanceComparisonChart performance={speedPerformance} />
        </div>


        <ProfileTests profiles={profileDetails} />


        <div>
          <RecentSimulations runs={recentRuns} />
        </div>
      </div>
    </DashboardLayout>
  )
}

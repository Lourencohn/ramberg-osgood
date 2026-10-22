import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { KpiStrip } from '@/components/dashboard/kpi-strip'
import { CurveOverlayCard } from '@/components/dashboard/curve-overlay-card'
import { ThermalRings } from '@/components/dashboard/thermal-rings'
import { EditorialActions } from '@/components/dashboard/editorial-actions'
import { ProfileMatrix } from '@/components/dashboard/profile-matrix'
import { getDashboardData } from '@/lib/dashboard-data'

export const dynamic = 'force-dynamic'

const numberFormatter = new Intl.NumberFormat('pt-BR')

export default async function DashboardPage() {
  const { stats, temperatureUsage, profileDetails } = await getDashboardData()

  const avgPoints = stats.totalTests ? Math.round(stats.totalMeasurements / stats.totalTests) : 0
  const lastReading = stats.lastTest?.createdAt
    ? format(new Date(stats.lastTest.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })
    : null

  const kpis = [
    {
      caption: 'Ensaios catalogados',
      value: stats.totalTests.toString().padStart(3, '0'),
      hint: `${stats.testsWithStress} com tensão calculada`,
      accent: true,
    },
    {
      caption: 'Perfis distintos',
      value: stats.totalProfiles.toString().padStart(2, '0'),
      hint: 'Material × temperatura × velocidade',
    },
    {
      caption: 'Pontos medidos',
      value: numberFormatter.format(stats.totalMeasurements),
      hint: `~${numberFormatter.format(avgPoints)} por ensaio`,
    },
    {
      caption: 'Modelo ativo',
      value: 'R.O',
      hint: 'Ramberg-Osgood com regressão linear',
    },
  ]

  return (
    <DashboardLayout>
      <PageShell
        chapter="N.º 001"
        rubric="Painel experimental"
        title="Panorama"
        accent="experimental"
        description={
          <>
            Comportamento mecânico de peças impressas em FDM, modelado por{' '}
            <em className="font-display text-foreground">Ramberg-Osgood</em> sobre ensaios reais de
            tração.{lastReading ? ` Última leitura em ${lastReading}.` : null}
          </>
        }
        fit
      >
        <KpiStrip items={kpis} />

        <section className="grid grid-cols-1 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <CurveOverlayCard profiles={profileDetails} />

          <div className="flex flex-col gap-4 xl:min-h-0">
            <ProfileMatrix profiles={profileDetails} />

            <div className="grid grid-cols-1 shrink-0 gap-4 md:grid-cols-2">
              <ThermalRings data={temperatureUsage} totalRuns={stats.totalTests} />
              <EditorialActions />
            </div>
          </div>
        </section>
      </PageShell>
    </DashboardLayout>
  )
}

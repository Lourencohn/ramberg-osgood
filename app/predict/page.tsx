import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PredictionForm } from "@/components/prediction-form"
import { ResultsDisplay } from "@/components/results-display"

export default function PredictPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Nova Predição</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Configure os parâmetros de impressão para prever as propriedades mecânicas
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <PredictionForm />
          </section>

          <section>
            <ResultsDisplay />
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}

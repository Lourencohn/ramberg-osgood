import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ImportForm } from '@/components/import/import-form'
import { UploadCloud, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ImportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
                <UploadCloud className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Importar Ensaios</h1>
                <p className="text-muted-foreground">
                  Suba arquivos de tracao e deformacao para alimentar o banco de dados.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Alert className="border-foreground/20 bg-white">
          <Info className="size-4 text-foreground" />
          <AlertDescription className="text-sm">
            A importacao suporta CSV/TXT com cabecalho. Para arquivos sem cabecalho, informe o
            mapeamento de colunas na secao avancada.
          </AlertDescription>
        </Alert>

        <ImportForm />
      </div>
    </DashboardLayout>
  )
}

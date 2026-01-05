import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { ImportForm } from '@/components/import/import-form'
import { UploadCloud, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ImportPage() {
  return (
    <DashboardLayout>
      <PageShell
        title="Importar Ensaios"
        description="Suba arquivos de tracao e deformacao para alimentar o banco de dados."
        icon={<UploadCloud className="size-5" />}
      >
        <Alert className="border-foreground/20 bg-white dark:bg-black dark:text-white">
          <Info className="size-4 text-foreground" />
          <AlertDescription className="text-sm">
            A importacao suporta CSV/TXT com cabecalho. Para arquivos sem cabecalho, informe o
            mapeamento de colunas na secao avancada.
          </AlertDescription>
        </Alert>

        <ImportForm />
      </PageShell>
    </DashboardLayout>
  )
}

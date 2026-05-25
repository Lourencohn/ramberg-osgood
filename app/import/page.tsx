import Link from 'next/link'
import { Info, FileSpreadsheet } from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { ImportForm } from '@/components/import/import-form'
import { Button } from '@/components/ui/button'

export default function ImportPage() {
  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. IV"
        rubric="Importação"
        title="Importar"
        accent="ensaios"
        description="Envie arquivos CSV ou TXT com os pontos de tração. O sistema cadastra o perfil de impressão automaticamente quando precisar."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/history">
              <FileSpreadsheet className="size-4" />
              Ver histórico
            </Link>
          </Button>
        }
      >
        <div className="flex items-start gap-3 rounded-md border border-foreground/15 bg-card p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-copper-deep" />
          <div className="space-y-1 text-sm">
            <p className="font-medium">Formatos aceitos</p>
            <p className="text-muted-foreground">
              Arquivos CSV ou TXT com cabeçalho. Se o arquivo não tiver cabeçalho, informe o
              mapeamento de colunas na seção avançada.
            </p>
          </div>
        </div>

        <ImportForm />
      </PageShell>
    </DashboardLayout>
  )
}

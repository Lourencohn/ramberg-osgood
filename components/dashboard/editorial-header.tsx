import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type EditorialHeaderProps = {
  totalTests: number
  lastTestAt?: string | null
}

export function EditorialHeader({ totalTests, lastTestAt }: EditorialHeaderProps) {
  const today = new Date()
  const dateLabel = format(today, "EEEE',' dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const lastLabel = lastTestAt
    ? format(new Date(lastTestAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })
    : null

  return (
    <header className="relative">
      {/* Editorial top rule */}
      <div className="flex items-center gap-3 pb-3 border-b border-foreground/15">
        <span className="label-caps-copper">N.º 001</span>
        <span className="h-px flex-1 bg-foreground/10" />
        <span className="label-caps tabular-nums">{dateLabel}</span>
        <span className="h-px w-8 bg-foreground/10" />
        <span className="label-caps">Painel Experimental</span>
      </div>

      <div className="flex flex-col gap-4 pt-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-[44px] leading-[1] tracking-tight md:text-[58px] md:leading-[0.95]">
            <span className="italic">Panorama</span>{' '}
            <span className="italic text-copper-deep">experimental</span>
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
            Comportamento mecânico de peças impressas em FDM, modelado por{' '}
            <em className="font-display text-foreground">Ramberg-Osgood</em> sobre ensaios reais de
            tração.
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 md:items-end">
          <span className="label-caps">Última leitura</span>
          <p className="font-mono-data text-sm">{lastLabel ?? 'sem dados'}</p>
          <p className="font-mono-data text-xs text-muted-foreground">
            {totalTests.toString().padStart(3, '0')} ensaios catalogados
          </p>
        </div>
      </div>
    </header>
  )
}

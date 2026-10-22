import Link from 'next/link'
import { Sparkles, GitCompare, Layers, FileSpreadsheet } from 'lucide-react'

const actions = [
  {
    href: '/predict',
    label: 'Nova predição',
    hint: 'Gere uma curva σ x ε a partir dos parâmetros de impressão.',
    icon: Sparkles,
    accent: true,
  },
  {
    href: '/compare',
    label: 'Comparar ensaios',
    hint: 'Sobreponha resultados de diferentes perfis.',
    icon: GitCompare,
  },
  {
    href: '/atlas',
    label: 'Atlas paramétrico',
    hint: 'Espaço E, σ₀ e n em três dimensões.',
    icon: Layers,
  },
  {
    href: '/history',
    label: 'Histórico completo',
    hint: 'Lista de ensaios e exportação.',
    icon: FileSpreadsheet,
  },
]

export function EditorialActions() {
  return (
    <nav aria-label="Ações" className="rounded-md border border-foreground/15 bg-card px-4 py-3">
      <div className="flex items-center justify-between border-b border-foreground/10 pb-2">
        <span className="label-caps-brand">Coluna II</span>
        <span className="label-caps">Atalhos</span>
      </div>
      <ul className="mt-1 divide-y divide-foreground/10">
        {actions.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="group flex items-center gap-3 py-2 transition-colors hover:text-brand-deep"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${
                  action.accent
                    ? 'border-brand bg-brand-soft text-brand-deep'
                    : 'border-foreground/15 bg-background text-foreground'
                } transition-all group-hover:border-brand group-hover:bg-brand-soft group-hover:text-brand-deep`}
              >
                <action.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] leading-tight">{action.label}</p>
                <p className="truncate font-sans text-[11px] leading-snug text-muted-foreground">
                  {action.hint}
                </p>
              </div>
              <span aria-hidden="true" className="font-mono-data text-xs text-foreground/30">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

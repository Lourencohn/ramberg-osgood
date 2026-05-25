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
    <nav aria-label="Ações" className="rounded-md border border-foreground/15 bg-card p-4">
      <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
        <span className="label-caps-copper">Coluna II</span>
        <span className="label-caps">Atalhos</span>
      </div>
      <ul className="mt-1 divide-y divide-foreground/10">
        {actions.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              className="group flex items-center gap-3 py-3 transition-colors hover:text-copper-deep"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                  action.accent
                    ? 'border-copper bg-copper-soft text-copper-deep'
                    : 'border-foreground/15 bg-background text-foreground'
                } transition-all group-hover:border-copper group-hover:bg-copper-soft group-hover:text-copper-deep`}
              >
                <action.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base leading-tight">{action.label}</p>
                <p className="font-sans text-[11px] leading-snug text-muted-foreground">
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

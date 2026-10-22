import type React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { cn } from '@/lib/utils'

type PageShellProps = {
  title: string
  description?: React.ReactNode
  chapter?: string
  rubric?: string
  accent?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  fit?: boolean
}

export function PageShell({
  title,
  description,
  chapter,
  rubric,
  accent,
  actions,
  children,
  className,
  contentClassName,
  fit = false,
}: PageShellProps) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div
      className={cn(
        'relative isolate mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-4',
        fit && 'xl:min-h-[34rem]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 graph-paper opacity-60" aria-hidden="true" />

      <header className="flex shrink-0 flex-col gap-3 border-b border-foreground/15 pb-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {chapter ? <span className="label-caps-brand">{chapter}</span> : null}
            {rubric ? (
              <>
                <MetaDivider />
                <span className="label-caps">{rubric}</span>
              </>
            ) : null}
            <MetaDivider />
            <span className="label-caps tabular-nums">{today}</span>
          </div>

          <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline lg:gap-5">
            <h1 className="shrink-0 font-display text-[28px] leading-none tracking-tight md:text-[32px]">
              <span className="italic">{title}</span>
              {accent ? <span className="italic text-brand-deep">{` ${accent}`}</span> : null}
            </h1>
            {description ? (
              <p className="max-w-5xl text-[13px] leading-snug text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      <div className={cn('flex flex-1 flex-col gap-4', fit && 'xl:min-h-0', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

function MetaDivider() {
  return <span className="h-px w-4 bg-foreground/20" aria-hidden="true" />
}

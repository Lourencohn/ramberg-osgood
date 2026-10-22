import type React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { cn } from '@/lib/utils'

type PageShellProps = {
  title: string
  description?: string
  chapter?: string
  rubric?: string
  accent?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  fullBleed?: boolean
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
  fullBleed = false,
}: PageShellProps) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div
      className={cn(
        'relative isolate flex min-h-0 flex-1 flex-col gap-8 pb-12',
        !fullBleed && 'mx-auto w-full max-w-[1320px]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 graph-paper opacity-60" aria-hidden="true" />

      <header>
        <div className="flex items-center gap-3 border-b border-foreground/15 pb-3">
          {chapter ? <span className="label-caps-brand">{chapter}</span> : null}
          <span className="h-px flex-1 bg-foreground/10" />
          <span className="label-caps tabular-nums">{today}</span>
          {rubric ? (
            <>
              <span className="h-px w-8 bg-foreground/10" />
              <span className="label-caps">{rubric}</span>
            </>
          ) : null}
        </div>

        <div className="flex flex-col gap-5 pt-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-[40px] leading-[1] tracking-tight md:text-[52px] md:leading-[0.95]">
              <span className="italic">{title}</span>
              {accent ? <span className="italic text-brand-deep">{` ${accent}`}</span> : null}
            </h1>
            {description ? (
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </header>

      <div className={cn('min-h-0 flex-1 space-y-6', contentClassName)}>{children}</div>
    </div>
  )
}

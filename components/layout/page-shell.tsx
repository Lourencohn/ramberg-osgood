import type React from 'react'

import { cn } from '@/lib/utils'

type PageShellProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function PageShell({
  title,
  description,
  icon,
  actions,
  children,
  className,
  contentClassName,
}: PageShellProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
              {icon}
            </div>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-1.5 text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn('min-h-0 flex-1 space-y-6', contentClassName)}>{children}</div>
    </div>
  )
}

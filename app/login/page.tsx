import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { LoginForm } from '@/components/login-form'

const loginErrors: Record<string, string> = {
  'missing-fields': 'Informe e-mail e senha para continuar.',
  'invalid-credentials': 'E-mail ou senha inválidos.',
  'session-expired': 'Sua sessão expirou. Entre novamente.',
}

type PageProps = {
  searchParams?: { error?: string } | Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const errorKey = resolvedSearchParams?.error
  const errorMessage = errorKey ? loginErrors[errorKey] : undefined
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 grain opacity-60" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-svh max-w-md flex-col px-6 py-8 sm:px-8 md:py-12">
        <header className="flex items-center gap-3 border-b border-foreground/15 pb-3">
          <span className="label-caps-copper">Acesso</span>
          <span className="h-px flex-1 bg-foreground/10" />
          <span className="label-caps tabular-nums">{today}</span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-card">
              <Image src="/logo.png" alt="ResistencIA" width={40} height={40} />
            </div>
            <h1 className="font-display text-[40px] italic leading-none tracking-tight md:text-[48px]">
              Bem-vindo de <span className="text-copper-deep">volta</span>
            </h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Entre para continuar acessando os ensaios, predições e o histórico do laboratório.
            </p>
          </div>

          <LoginForm error={errorMessage} />
        </div>

        <footer className="border-t border-foreground/15 pt-3 text-center text-[10px] uppercase tracking-[0.18em] text-foreground/40">
          ResistencIA · vol. 01
        </footer>
      </div>
    </div>
  )
}

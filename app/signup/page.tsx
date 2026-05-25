import Image from 'next/image'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { SignupForm } from '@/components/signup-form'
import { getCurrentUser } from '@/lib/auth'

const signupErrors: Record<string, string> = {
  'missing-fields': 'Preencha nome, e-mail e senha para continuar.',
  'password-mismatch': 'As senhas não conferem.',
  'weak-password': 'A senha precisa ter pelo menos 8 caracteres.',
  'email-in-use': 'Já existe um cadastro com este e-mail.',
}

type PageProps = {
  searchParams?: { error?: string } | Promise<{ error?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

  const resolvedSearchParams = await searchParams
  const errorKey = resolvedSearchParams?.error
  const errorMessage = errorKey ? signupErrors[errorKey] : undefined
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 grain opacity-60" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-svh max-w-md flex-col px-6 py-8 sm:px-8 md:py-12">
        <header className="flex items-center gap-3 border-b border-foreground/15 pb-3">
          <span className="label-caps-copper">Cadastro</span>
          <span className="h-px flex-1 bg-foreground/10" />
          <span className="label-caps tabular-nums">{today}</span>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-card">
              <Image src="/logo.png" alt="ResistencIA" width={40} height={40} />
            </div>
            <h1 className="font-display text-[40px] italic leading-none tracking-tight md:text-[48px]">
              Crie sua <span className="text-copper-deep">conta</span>
            </h1>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Em poucos passos você passa a registrar ensaios, gerar predições e comparar perfis.
            </p>
          </div>

          <SignupForm error={errorMessage} />
        </div>

        <footer className="border-t border-foreground/15 pt-3 text-center text-[10px] uppercase tracking-[0.18em] text-foreground/40">
          ResistencIA · vol. 01
        </footer>
      </div>
    </div>
  )
}

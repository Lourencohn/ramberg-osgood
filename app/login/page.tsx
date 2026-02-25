import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"

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

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          ResistencIA
        </a>
        <LoginForm error={errorMessage} />
      </div>
    </div>
  )
}

import { redirect } from "next/navigation"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { getCurrentUser } from "@/lib/auth"

const loginErrors: Record<string, string> = {
  "missing-fields": "Informe e-mail e senha para continuar.",
  "invalid-credentials": "E-mail ou senha inválidos.",
  "session-expired": "Sua sessão expirou. Entre novamente.",
}

type PageProps = {
  searchParams?: { error?: string } | Promise<{ error?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  const resolvedSearchParams = await searchParams
  const errorKey = resolvedSearchParams?.error
  const errorMessage = errorKey ? loginErrors[errorKey] : undefined

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col items-center gap-8">
        <Image
          src="/logo.png"
          alt="Logo do projeto ResistencIA"
          width={720}
          height={480}
          priority
          className="h-auto w-full max-w-[360px] md:max-w-[520px]"
        />
        <div className="w-full max-w-sm">
          <LoginForm error={errorMessage} />
        </div>
      </div>
    </div>
  )
}

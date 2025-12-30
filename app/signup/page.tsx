import { redirect } from "next/navigation"
import { SignupForm } from "@/components/signup-form"
import { getCurrentUser } from "@/lib/auth"

const signupErrors: Record<string, string> = {
  "missing-fields": "Preencha nome, e-mail e senha para continuar.",
  "password-mismatch": "As senhas não conferem.",
  "weak-password": "A senha precisa ter pelo menos 8 caracteres.",
  "email-in-use": "Já existe um cadastro com este e-mail.",
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
  const errorMessage = errorKey ? signupErrors[errorKey] : undefined

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm error={errorMessage} />
      </div>
    </div>
  )
}

import type React from "react"
import Link from "next/link"

import { signupAction } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SignupFormProps = React.ComponentProps<typeof Card> & {
  error?: string
}

export function SignupForm({ error, ...props }: SignupFormProps) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Preencha seus dados para criar um novo acesso.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signupAction} className="space-y-6">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nome completo</FieldLabel>
              <Input id="name" name="name" type="text" placeholder="" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder=""
                autoComplete="email"
                required
              />
              <FieldDescription>
                Vamos usar este e-mail apenas para autenticação e contato.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
              />
              <FieldDescription>Mínimo de 8 caracteres.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirme a senha</FieldLabel>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
            <Field>
              <Button type="submit" className="w-full">
                Criar conta
              </Button>
              <FieldDescription className="text-center">
                Já possui acesso? <Link href="/">Entrar</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

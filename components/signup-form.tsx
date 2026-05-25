import type React from 'react'
import Link from 'next/link'

import { signupAction } from '@/lib/auth-actions'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type SignupFormProps = React.ComponentProps<'div'> & {
  error?: string
}

export function SignupForm({ error, className, ...props }: SignupFormProps) {
  return (
    <div
      className={`rounded-md border border-foreground/15 bg-card p-6 shadow-sm ${className ?? ''}`}
      {...props}
    >
      <form action={signupAction} className="space-y-5">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name" className="label-caps">
              Nome completo
            </FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              className="h-11 border-foreground/15 focus-visible:ring-copper"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email" className="label-caps">
              E-mail
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-11 border-foreground/15 focus-visible:ring-copper"
              required
            />
            <FieldDescription>Usamos apenas para autenticação e contato.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="password" className="label-caps">
              Senha
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="h-11 border-foreground/15 focus-visible:ring-copper"
              required
            />
            <FieldDescription>Mínimo de 8 caracteres.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password" className="label-caps">
              Confirme a senha
            </FieldLabel>
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              className="h-11 border-foreground/15 focus-visible:ring-copper"
              required
            />
          </Field>
          <Field>
            <Button
              type="submit"
              className="h-11 w-full bg-foreground text-background hover:bg-foreground/90"
            >
              Criar conta
            </Button>
            <FieldDescription className="text-center">
              Já possui acesso?{' '}
              <Link href="/login" className="font-medium text-copper-deep hover:underline">
                Entrar
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}

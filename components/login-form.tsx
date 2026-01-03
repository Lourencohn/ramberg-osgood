import type React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { loginAction } from '@/lib/auth-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type LoginFormProps = React.ComponentProps<'div'> & {
  error?: string
}

export function LoginForm({ className, error, ...props }: LoginFormProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Acesse sua conta</CardTitle>
          <CardDescription>Use seu e-mail e senha para entrar na plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-6">
            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <FieldGroup>
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
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
                <FieldDescription className="text-center">
                  Ainda não tem conta? <Link href="/signup">Criar acesso</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

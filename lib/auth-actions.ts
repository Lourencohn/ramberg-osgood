'use server'

import { redirect } from 'next/navigation'
import { clearSession, createSession, createUser, verifyUser } from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    redirect('/login?error=missing-fields')
  }

  const user = await verifyUser(email, password)
  if (!user) {
    redirect('/login?error=invalid-credentials')
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirm-password') ?? '')

  if (!name || !email || !password || !confirmPassword) {
    redirect('/signup?error=missing-fields')
  }

  if (password.length < 8) {
    redirect('/signup?error=weak-password')
  }

  if (password !== confirmPassword) {
    redirect('/signup?error=password-mismatch')
  }

  try {
    const user = await createUser({ name, email, password })
    await createSession(user.id)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === '23505') {
      redirect('/signup?error=email-in-use')
    }
    throw error
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  await clearSession()
  redirect('/login')
}

import { ForgotPasswordForm } from '@/components/modules/auth/ForgotPasswordForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Passwort vergessen' }

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}

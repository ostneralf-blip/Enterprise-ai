import { ResetPasswordForm } from '@/components/modules/auth/ResetPasswordForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Neues Passwort festlegen' }

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}

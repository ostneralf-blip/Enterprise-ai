import { LoginForm } from '@/components/modules/auth/LoginForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Anmelden' }

export default function LoginPage() {
  return <LoginForm />
}

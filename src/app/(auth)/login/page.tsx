import { LoginForm } from '@/components/modules/auth/LoginForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Anmelden' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; message?: string }>
}) {
  return <LoginForm searchParams={searchParams} />
}

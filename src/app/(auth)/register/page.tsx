import { RegisterForm } from '@/components/modules/auth/RegisterForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Registrieren' }

export default function RegisterPage() {
  return <RegisterForm />
}

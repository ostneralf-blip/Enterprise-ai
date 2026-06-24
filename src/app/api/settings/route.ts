import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100),
  company:   z.string().max(100).nullable().optional(),
  role:      z.string().max(100).nullable().optional(),
  phone:     z.string().max(50).nullable().optional(),
  mobile:    z.string().max(50).nullable().optional(),
  street:    z.string().max(200).nullable().optional(),
  zip:       z.string().max(20).nullable().optional(),
  city:      z.string().max(100).nullable().optional(),
})

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parse = ProfileUpdateSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

    const { full_name, company, role, phone, mobile, street, zip, city } = parse.data
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        company: company ?? null,
        role: role ?? null,
        phone: phone ?? null,
        mobile: mobile ?? null,
        street: street ?? null,
        zip: zip ?? null,
        city: city ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, full_name, company, role, phone, mobile, street, zip, city')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

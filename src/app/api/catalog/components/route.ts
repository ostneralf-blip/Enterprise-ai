import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const vendor        = searchParams.get('vendor')
  const layer         = searchParams.get('layer')
  const cloudProvider = searchParams.get('cloud_provider')
  const hosting       = searchParams.get('hosting')
  const sapCompatible = searchParams.get('sap_compatible')
  const search        = searchParams.get('q')

  let query = supabase
    .from('component_catalog')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(2000)

  if (vendor)        query = query.eq('vendor', vendor)
  if (layer)         query = query.eq('architecture_layer', layer)
  if (cloudProvider) query = query.eq('cloud_provider', cloudProvider)
  if (hosting)       query = query.contains('hosting', [hosting])
  if (sapCompatible) query = query.eq('sap_compatible', sapCompatible === 'true')
  if (search)        query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

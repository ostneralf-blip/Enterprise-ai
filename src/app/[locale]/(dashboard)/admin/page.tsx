import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminPageClient } from './AdminPageClient'
import type { ContentLibraryEntry, UserProfile, CatalogComponent, CatalogSource, CatalogUploadLog, ComplianceSourceDraft, SourceScanStatus } from '@/types'
import { COMPLIANCE_SOURCES } from '@/lib/compliance/scanner'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  // Service-role client bypasses RLS to load all user profiles
  const adminClient = await createAdminClient()
  const [{ data: entries }, { data: users }, { data: components }, { count: componentCount }, { data: sources }, { data: uploadLog }, { data: drafts }, { data: snapshots }, { data: policyTemplates }] = await Promise.all([
    adminClient
      .from('content_library')
      .select('*')
      .order('module', { ascending: true })
      .order('created_at', { ascending: false }),
    adminClient
      .from('profiles')
      .select('id, email, full_name, company, tier, is_admin, is_banned, feature_flags, stripe_customer_id, subscription_status, subscription_period_end, created_at')
      .order('created_at', { ascending: false }),
    adminClient
      .from('component_catalog')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(100),
    adminClient
      .from('component_catalog')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    adminClient
      .from('catalog_sources')
      .select('id, name, type, url, sync_interval_days, last_synced_at, last_sync_added, last_sync_updated, sync_status, last_sync_error, config, is_active, created_at')
      .order('name', { ascending: true }),
    adminClient
      .from('catalog_upload_log')
      .select('id, filename, format, row_count, vendor_override, layer_override, source, uploaded_at')
      .order('uploaded_at', { ascending: false })
      .limit(50),
    adminClient
      .from('compliance_source_drafts')
      .select('*')
      .order('scanned_at', { ascending: false })
      .limit(50),
    adminClient
      .from('source_snapshots')
      .select('url, label, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(25),
    adminClient
      .from('policy_templates')
      .select('*')
      .order('display_order', { ascending: true })
      .order('locale', { ascending: true }),
  ])

  // Letzten Scan-Zeitpunkt je Quelle ermitteln (neuester Snapshot gewinnt)
  const snapshotMap = new Map<string, string>()
  for (const snap of (snapshots ?? [])) {
    if (!snapshotMap.has(snap.url)) snapshotMap.set(snap.url, snap.fetched_at)
  }
  const initialSourceSnapshots: SourceScanStatus[] = COMPLIANCE_SOURCES.map(src => ({
    url: src.url,
    label: src.label,
    fetched_at: snapshotMap.get(src.url) ?? null,
  }))

  return (
    <AdminPageClient
      initialEntries={(entries ?? []) as ContentLibraryEntry[]}
      initialUsers={(users ?? []) as UserProfile[]}
      initialComponents={(components ?? []) as CatalogComponent[]}
      componentCount={componentCount ?? 0}
      initialSources={(sources ?? []) as CatalogSource[]}
      initialUploadLog={(uploadLog ?? []) as CatalogUploadLog[]}
      initialDrafts={(drafts ?? []) as ComplianceSourceDraft[]}
      initialSourceSnapshots={initialSourceSnapshots}
      initialPolicyTemplates={policyTemplates ?? []}
    />
  )
}

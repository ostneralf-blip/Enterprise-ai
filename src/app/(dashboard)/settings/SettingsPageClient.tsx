'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types'

interface Props {
  profile: {
    full_name: string | null
    company: string | null
    role: string | null
    tier: Tier
    stripe_customer_id: string | null
  }
  email: string
}

const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const TIER_COLORS: Record<Tier, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-violet-100 text-violet-700',
}

const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400'
const labelClass = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5'

export function SettingsPageClient({ profile, email }: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [company, setCompany] = useState(profile.company ?? '')
  const [role, setRole] = useState(profile.role ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const hasBilling = profile.tier !== 'free' && !!profile.stripe_customer_id

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'LÖSCHEN') return
    setDeleting(true)
    setDeleteError(null)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      setDeleteError(json.error ?? 'Fehler beim Löschen.')
      setDeleting(false)
      return
    }
    window.location.href = '/login?deleted=1'
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { setError('Name ist ein Pflichtfeld.'); return }
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim(), company: company.trim() || null, role: role.trim() || null }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Fehler beim Speichern.'); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setPortalError(null)
    const res = await fetch('/api/settings/portal', { method: 'POST' })
    const json = await res.json()
    setPortalLoading(false)
    if (!res.ok) { setPortalError(json.error ?? 'Portal nicht erreichbar.'); return }
    window.location.href = json.url
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* Profil */}
      <section aria-labelledby="profile-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h2 id="profile-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-5">Profil</h2>
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div>
            <label htmlFor="full-name" className={labelClass}>Name *</label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              maxLength={100}
              required
              aria-required="true"
              placeholder="Dein vollständiger Name"
              className={inputClass}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>Unternehmen</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              maxLength={100}
              placeholder="Firmenname"
              className={inputClass}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="role" className={labelClass}>Rolle</label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              maxLength={100}
              placeholder="z. B. CTO, Head of AI, IT-Leiter"
              className={inputClass}
              disabled={saving}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                saving ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'
              )}
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            {saved && (
              <span role="status" className="text-sm text-emerald-600 font-medium">Gespeichert</span>
            )}
          </div>
        </form>
      </section>

      {/* Konto */}
      <section aria-labelledby="account-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h2 id="account-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-5">Konto</h2>
        <dl className="space-y-4">
          <div>
            <dt className={labelClass}>E-Mail</dt>
            <dd className="text-sm text-slate-700 min-w-0 truncate">{email}</dd>
          </div>
          <div>
            <dt className={labelClass}>Tarif</dt>
            <dd>
              <span className={cn('inline-block text-xs font-semibold px-2.5 py-1 rounded-full', TIER_COLORS[profile.tier])}>
                {TIER_LABELS[profile.tier]}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Abrechnung — nur Pro/Enterprise */}
      {profile.tier !== 'free' && (
        <section aria-labelledby="billing-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <h2 id="billing-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Abrechnung</h2>
          <p className="text-sm text-slate-500 mb-5">
            Rechnungen, Zahlungsmethode und Abonnement über das Stripe-Portal verwalten.
          </p>

          {portalError && (
            <p role="alert" className="text-sm text-red-600 mb-3">{portalError}</p>
          )}

          {hasBilling ? (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-xl border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                portalLoading
                  ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              {portalLoading ? 'Weiterleitung...' : 'Abrechnungsportal öffnen →'}
            </button>
          ) : (
            <p className="text-sm text-slate-400">
              Stripe-Kundenkonto noch nicht verknüpft. Wende dich an den Support.
            </p>
          )}
        </section>
      )}
      {/* Gefahrenzone */}
      <section aria-labelledby="danger-heading" className="bg-white border border-red-200 rounded-2xl p-4 sm:p-6">
        <h2 id="danger-heading" className="text-base sm:text-lg font-semibold text-red-600 mb-2">Konto löschen</h2>
        <p className="text-sm text-slate-500 mb-4">
          Löscht dein Konto und alle damit verbundenen Daten unwiderruflich (Art. 17 DSGVO).
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="delete-confirm" className={labelClass}>
              Gib <strong>LÖSCHEN</strong> ein, um zu bestätigen
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="LÖSCHEN"
              className={cn(inputClass, 'border-red-200 focus:ring-red-500 focus:border-red-400')}
              disabled={deleting}
            />
          </div>
          {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'LÖSCHEN' || deleting}
            className="px-5 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {deleting ? 'Wird gelöscht…' : 'Konto unwiderruflich löschen'}
          </button>
        </div>
      </section>

    </div>
  )
}

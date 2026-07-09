'use client'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Tier } from '@/types'

interface Props {
  profile: {
    full_name: string | null
    company: string | null
    role: string | null
    tier: Tier
    stripe_customer_id: string | null
    phone: string | null
    mobile: string | null
    street: string | null
    zip: string | null
    city: string | null
    guided_path_reset_at: string | null
    theme: 'book' | 'teal' | 'indigo' | 'dark'
  }
  email: string
}

const THEMES = [
  { id: 'book'   as const, label: 'Buch-Blau',  swatch: '#1D4ED8' },
  { id: 'teal'   as const, label: 'Teal',        swatch: '#0D9488' },
  { id: 'indigo' as const, label: 'Indigo',      swatch: '#4F46E5' },
  { id: 'dark'   as const, label: 'Dark Mode',   swatch: '#0F172A' },
]

const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const TIER_COLORS: Record<Tier, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-primary-soft text-primary-hover',
  enterprise: 'bg-violet-100 text-violet-700',
}

const inputClass = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary-ring disabled:bg-slate-50 disabled:text-slate-400'
const labelClass = 'block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5'

export function SettingsPageClient({ profile, email }: Props) {
  const t = useTranslations('settings')
  const locale = useLocale()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [company, setCompany] = useState(profile.company ?? '')
  const [role, setRole] = useState(profile.role ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [mobile, setMobile] = useState(profile.mobile ?? '')
  const [street, setStreet] = useState(profile.street ?? '')
  const [zip, setZip] = useState(profile.zip ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [currentTheme, setCurrentTheme] = useState<'book' | 'teal' | 'indigo' | 'dark'>(profile.theme)
  const [themeSaving, setThemeSaving] = useState(false)

  const handleThemeChange = async (t: 'book' | 'teal' | 'indigo' | 'dark') => {
    setCurrentTheme(t)
    document.documentElement.setAttribute('data-theme', t)  // sofortige Vorschau
    setThemeSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName || profile.full_name || 'User', theme: t }),
      })
    } finally {
      setThemeSaving(false)
    }
  }

  const [wizardResetting, setWizardResetting] = useState(false)
  const [wizardResetAt, setWizardResetAt] = useState<string | null>(profile.guided_path_reset_at)
  const [wizardResetError, setWizardResetError] = useState<string | null>(null)

  const pwRules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9\W]/.test(newPassword),
  }
  const pwValid = Object.values(pwRules).every(Boolean) && newPassword === confirmPassword && newPassword.length > 0

  const handlePasswordChange = async () => {
    if (!pwValid) { setPwError(t('pwErrorRequired')); return }
    if (newPassword !== confirmPassword) { setPwError(t('pwMismatch')); return }
    setPwSaving(true)
    setPwError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) { setPwError(error.message); return }
    setPwSaved(true)
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPwSaved(false), 4000)
  }

  const hasBilling = profile.tier !== 'free' && !!profile.stripe_customer_id

  const handleWizardReset = async () => {
    if (!confirm(t('wizardResetConfirm'))) return
    setWizardResetting(true)
    setWizardResetError(null)
    const res = await fetch('/api/account/wizard-reset', { method: 'POST' })
    setWizardResetting(false)
    if (!res.ok) {
      const json = await res.json()
      setWizardResetError(json.error ?? t('resetError'))
      return
    }
    setWizardResetAt(new Date().toISOString())
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'LÖSCHEN') return
    setDeleting(true)
    setDeleteError(null)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json()
      setDeleteError(json.error ?? t('deleteError'))
      setDeleting(false)
      return
    }
    window.location.href = '/login?deleted=1'
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { setError(t('nameRequired')); return }
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        company: company.trim() || null,
        role: role.trim() || null,
        phone: phone.trim() || null,
        mobile: mobile.trim() || null,
        street: street.trim() || null,
        zip: zip.trim() || null,
        city: city.trim() || null,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? t('error')); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setPortalError(null)
    const res = await fetch('/api/settings/portal', { method: 'POST' })
    const json = await res.json()
    setPortalLoading(false)
    if (!res.ok) { setPortalError(json.error ?? t('openPortal')); return }
    window.location.href = json.url
  }

  return (
    <div className="max-w-xl space-y-6">

      {/* Profil */}
      <section aria-labelledby="profile-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h2 id="profile-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-5">{t('profileSection')}</h2>
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
              placeholder={t('fullNamePlaceholder')}
              className={inputClass}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>{t('company')}</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              maxLength={100}
              placeholder={t('companyPlaceholder')}
              className={inputClass}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="role" className={labelClass}>{t('role')}</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className={labelClass}>{t('phone')}</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={50}
                placeholder="+49 89 123456"
                className={inputClass}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="mobile" className={labelClass}>{t('mobile')}</label>
              <input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                maxLength={50}
                placeholder="+49 170 1234567"
                className={inputClass}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="street" className={labelClass}>{t('streetLabel')}</label>
            <input
              id="street"
              type="text"
              value={street}
              onChange={e => setStreet(e.target.value)}
              maxLength={200}
              placeholder={t('streetPlaceholder')}
              className={inputClass}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div>
              <label htmlFor="zip" className={labelClass}>{t('zip')}</label>
              <input
                id="zip"
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                maxLength={20}
                placeholder="80331"
                className={inputClass}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="city" className={labelClass}>{t('city')}</label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                maxLength={100}
                placeholder={t('cityPlaceholder')}
                className={inputClass}
                disabled={saving}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2',
                saving ? 'bg-primary-ring text-white cursor-not-allowed' : 'bg-primary text-white hover:bg-primary'
              )}
            >
              {saving ? t('saving') : t('saveButton')}
            </button>
            {saved && (
              <span role="status" className="text-sm text-emerald-600 font-medium">{t('savedStatus')}</span>
            )}
          </div>
        </form>
      </section>

      {/* Konto */}
      <section aria-labelledby="account-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h2 id="account-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-5">{t('accountSection')}</h2>
        <dl className="space-y-4">
          <div>
            <dt className={labelClass}>{t('emailLabel')}</dt>
            <dd className="text-sm text-slate-700 min-w-0 truncate">{email}</dd>
          </div>
          <div>
            <dt className={labelClass}>{t('tierLabel')}</dt>
            <dd>
              <span className={cn('inline-block text-xs font-semibold px-2.5 py-1 rounded-full', TIER_COLORS[profile.tier])}>
                {TIER_LABELS[profile.tier]}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Sicherheit */}
      <section aria-labelledby="security-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h2 id="security-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-5">{t('securitySection')}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="new-password" className={labelClass}>{t('newPasswordLabel')}</label>
            <input id="new-password" type="password" value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPwSaved(false) }}
              placeholder={t('newPasswordPlaceholder')}
              className={inputClass} disabled={pwSaving} />
            {newPassword.length > 0 && (
              <ul className="mt-2 space-y-1" aria-label={t('passwordRequirementsLabel')}>
                {([
                  { ok: pwRules.length, label: t('pwRuleLength') },
                  { ok: pwRules.uppercase, label: t('pwRuleUppercase') },
                  { ok: pwRules.number, label: t('pwRuleNumber') },
                ] as { ok: boolean; label: string }[]).map(({ ok, label }) => (
                  <li key={label} className={cn('text-xs flex items-center gap-1.5 transition-colors', ok ? 'text-emerald-600' : 'text-slate-400')}>
                    <span aria-hidden="true">{ok ? '✓' : '○'}</span> {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="confirm-password" className={labelClass}>{t('confirmPasswordLabel')}</label>
            <input id="confirm-password" type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              className={cn(inputClass, confirmPassword.length > 0 && newPassword !== confirmPassword ? 'border-red-300 focus:ring-red-400' : '')}
              disabled={pwSaving} />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{t('pwMismatch')}</p>
            )}
          </div>
          {pwError && <p role="alert" className="text-sm text-red-600">{pwError}</p>}
          {pwSaved && <p role="status" className="text-sm text-emerald-600 font-medium">{t('pwSavedMsg')}</p>}
          <button type="button" onClick={handlePasswordChange} disabled={!pwValid || pwSaving}
            className="px-5 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap bg-primary text-white hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2">
            {pwSaving ? t('pwSaving') : t('changePassword')}
          </button>
        </div>
      </section>

      {/* Abrechnung — nur Pro/Enterprise */}
      {profile.tier !== 'free' && (
        <section aria-labelledby="billing-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
          <h2 id="billing-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{t('billingSection')}</h2>
          <p className="text-sm text-slate-500 mb-5">{t('billingDesc')}</p>

          {portalError && (
            <p role="alert" className="text-sm text-red-600 mb-3">{portalError}</p>
          )}

          {hasBilling ? (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-xl border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2',
                portalLoading
                  ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              {portalLoading ? t('portalLoading') : t('openPortal')}
            </button>
          ) : (
            <p className="text-sm text-slate-400">{t('stripeNotLinked')}</p>
          )}
        </section>
      )}
      {/* Assistent */}
      <section aria-labelledby="wizard-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <h2 id="wizard-heading" className="text-base sm:text-lg font-semibold text-slate-900 mb-1">{t('assistantSection')}</h2>
        <p className="text-sm text-slate-500 mb-5">{t('pathSettingsDesc')}</p>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{t('resetPathTitle')}</p>
              <p className="text-xs text-slate-500 mt-0.5">{t('resetPathInfo')}</p>
              {wizardResetAt && (
                <p className="text-xs text-emerald-600 mt-1">
                  {t('resetAtMsg', { date: new Date(wizardResetAt).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }) })}
                </p>
              )}
              {wizardResetError && (
                <p role="alert" className="text-xs text-red-600 mt-1">{wizardResetError}</p>
              )}
            </div>
            <button
              onClick={handleWizardReset}
              disabled={wizardResetting}
              className="whitespace-nowrap px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
            >
              {wizardResetting ? t('resetting') : t('resetPath')}
            </button>
          </div>
        </div>
      </section>

      {/* Darstellung */}
      <section aria-labelledby="display-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 id="display-heading" className="text-base sm:text-lg font-semibold text-slate-900">{t('darstellungSection')}</h2>
          {themeSaving && <span className="text-xs text-slate-400">{t('themeSavingMsg')}</span>}
        </div>
        <p className="text-sm text-slate-500 mb-5">{t('themeDesc')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2',
                currentTheme === theme.id
                  ? 'border-primary bg-primary-soft'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              )}
              aria-pressed={currentTheme === theme.id}
              aria-label={t('themeActivateAriaLabel', { label: theme.label })}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                style={{ background: theme.swatch }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-slate-700">{theme.label}</span>
              {currentTheme === theme.id && (
                <span className="text-[10px] text-primary font-semibold">{t('themeActive')}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Architektur-Diagramm — Demnächst */}
      <section aria-labelledby="diagram-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <h2 id="diagram-heading" className="text-base sm:text-lg font-semibold text-slate-900">{t('archDiagramSection')}</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{t('comingSoon')}</span>
        </div>
        <p className="text-sm text-slate-400">{t('archDiagramDesc')}</p>
      </section>

      {/* Geteilte Links — Demnächst */}
      <section aria-labelledby="shared-heading" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 opacity-60">
        <div className="flex items-center gap-2 mb-1">
          <h2 id="shared-heading" className="text-base sm:text-lg font-semibold text-slate-900">{t('sharedLinksSection')}</h2>
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{t('comingSoon')}</span>
        </div>
        <p className="text-sm text-slate-400">{t('sharedLinksDesc')}</p>
      </section>

      {/* Gefahrenzone */}
      <section aria-labelledby="danger-heading" className="bg-white border border-red-200 rounded-2xl p-4 sm:p-6">
        <h2 id="danger-heading" className="text-base sm:text-lg font-semibold text-red-600 mb-2">{t('dangerSection')}</h2>
        <p className="text-sm text-slate-500 mb-4">{t('deleteDesc')}</p>
        <div className="space-y-3">
          <div>
            <label htmlFor="delete-confirm" className={labelClass}>{t('deleteConfirmLabel')}</label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={t('deleteConfirmWord')}
              className={cn(inputClass, 'border-red-200 focus:ring-red-500 focus:border-red-400')}
              disabled={deleting}
            />
          </div>
          {deleteError && <p role="alert" className="text-sm text-red-600">{deleteError}</p>}
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== t('deleteConfirmWord') || deleting}
            className="px-5 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap bg-red-600 text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {deleting ? t('deleting') : t('deleteButton')}
          </button>
        </div>
      </section>

      {/* Rechtliches */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 pb-1">
        <Link href="/impressum" target="_blank" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">{t('impressum')}</Link>
        <Link href="/datenschutz" target="_blank" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">{t('datenschutz')}</Link>
        <Link href="/agb" target="_blank" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">{t('agb')}</Link>
      </div>

    </div>
  )
}

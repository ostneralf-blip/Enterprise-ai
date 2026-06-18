import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(date))
}

export function getScoreColor(score: number): string {
  if (score >= 4) return 'text-emerald-600'
  if (score >= 3) return 'text-amber-500'
  return 'text-red-500'
}

export function getScoreBg(score: number): string {
  if (score >= 4) return 'bg-emerald-50 border-emerald-200'
  if (score >= 3) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
}

'use client'

import type { CapabilityGroup } from '@/lib/architecture/capability'
import { MaturityPips } from './MaturityPips'
import { cn } from '@/lib/utils'

export function CapabilityView({ groups, emptyLabel }: { groups: CapabilityGroup[]; emptyLabel: string }) {
  if (groups.length === 0) {
    return <p className={cn('text-sm text-ink-muted py-6 text-center')}>{emptyLabel}</p>
  }

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3')}>
      {groups.map(g => (
        <div key={g.domain} className={cn('border border-line rounded-2xl bg-surface-raised p-3')}>
          <div className={cn('flex items-center justify-between mb-2')}>
            <span className={cn('text-xs font-bold uppercase tracking-wide text-ink-secondary')}>{g.domain}</span>
            <span className={cn('text-[10px] text-ink-muted')}>{g.tiles.length}</span>
          </div>
          <div className={cn('grid grid-cols-2 gap-1.5')}>
            {g.tiles.map(t => (
              <div key={t.id} className={cn('border border-line rounded-lg bg-surface px-2.5 py-2 flex flex-col gap-1.5')}>
                <span className={cn('text-[11px] font-semibold text-ink leading-tight')}>{t.name}</span>
                <MaturityPips level={t.level} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

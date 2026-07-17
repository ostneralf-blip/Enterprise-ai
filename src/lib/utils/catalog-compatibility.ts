import type { CatalogComponent } from '@/types'

// Sofort-Fallback wenn DB-Katalog noch nicht re-geseeded wurde (#199).
// Sobald alle Komponenten capability-Felder aus der DB haben, greift der dynamische Pfad.
const KNOWN_CAPABILITY_GROUPS: Record<string, string[]> = {
  api_gateway:   ['AWS API Gateway', 'Azure API Management', 'Kong Gateway'],
  primary_idp:   ['SAP BTP Auth & Trust', 'Microsoft Entra ID', 'Keycloak'],
  data_catalog:  ['Microsoft Purview', 'OpenMetadata', 'AWS DataZone'],
}

export interface Conflict {
  a: string
  b: string
  alternatives: string[]
}

export interface Suggestion {
  source: string
  target: string
}

export function findConflicts(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Conflict[] {
  const checkedList = Array.from(checked)
  const conflicts: Conflict[] = []
  const seen = new Set<string>()

  // Explicit incompatible_with pairs
  for (let i = 0; i < checkedList.length; i++) {
    for (let j = i + 1; j < checkedList.length; j++) {
      const a = checkedList[i]
      const b = checkedList[j]
      const compA = byName[a]
      const compB = byName[b]

      const isConflict =
        compA?.incompatible_with.includes(b) ||
        compB?.incompatible_with.includes(a)

      if (!isConflict) continue

      const pairKey = [a, b].sort().join('||')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)

      const alternatives = Array.from(new Set([
        ...(compA?.suggests ?? []),
        ...(compB?.suggests ?? []),
      ])).filter(alt => !checked.has(alt))

      conflicts.push({ a, b, alternatives })
    }
  }

  // Capability-based conflicts: ≥2 active components with same exclusive capability.
  // Primär: capability-Feld aus der DB. Fallback: KNOWN_CAPABILITY_GROUPS (#199).
  const byCapability = new Map<string, string[]>()
  for (const name of checkedList) {
    const dbCap = byName[name]?.capability
    if (dbCap) {
      const group = byCapability.get(dbCap) ?? []
      group.push(name)
      byCapability.set(dbCap, group)
    }
  }
  // Fallback: statische Gruppen für Komponenten ohne DB-Capability
  for (const [cap, members] of Object.entries(KNOWN_CAPABILITY_GROUPS)) {
    const activeMembers = checkedList.filter(
      n => members.includes(n) && !byName[n]?.capability
    )
    if (activeMembers.length > 0) {
      const existing = byCapability.get(cap) ?? []
      byCapability.set(cap, [...existing, ...activeMembers])
    }
  }
  for (const [, names] of byCapability) {
    if (names.length < 2) continue
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = names[i]
        const b = names[j]
        const pairKey = [a, b].sort().join('||')
        if (seen.has(pairKey)) continue
        seen.add(pairKey)
        const compA = byName[a]
        const compB = byName[b]
        const alternatives = Array.from(new Set([
          ...(compA?.suggests ?? []),
          ...(compB?.suggests ?? []),
        ])).filter(alt => !checked.has(alt))
        conflicts.push({ a, b, alternatives })
      }
    }
  }

  return conflicts
}

export function explainConflict(
  aName: string,
  bName: string,
  byName: Record<string, CatalogComponent>
): { de: string; en: string } {
  const compA = byName[aName]
  const compB = byName[bName]
  if (compA?.cloud_provider === 'sap' && compB?.cloud_provider !== 'sap') {
    return {
      de: `${aName} (SAP) und ${bName} sind nicht gemeinsam einsetzbar. Empfehlung: ${bName} entfernen — SAP-Landschaft hat Priorität.`,
      en: `${aName} (SAP) and ${bName} cannot be used together. Recommendation: remove ${bName} — SAP landscape takes priority.`,
    }
  }
  if (compB?.cloud_provider === 'sap' && compA?.cloud_provider !== 'sap') {
    return {
      de: `${bName} (SAP) und ${aName} sind nicht gemeinsam einsetzbar. Empfehlung: ${aName} entfernen — SAP-Landschaft hat Priorität.`,
      en: `${bName} (SAP) and ${aName} cannot be used together. Recommendation: remove ${aName} — SAP landscape takes priority.`,
    }
  }
  return {
    de: `${aName} und ${bName} sind inkompatibel und können nicht gleichzeitig eingesetzt werden.`,
    en: `${aName} and ${bName} are incompatible and cannot be used at the same time.`,
  }
}

export function findSuggestions(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Suggestion[] {
  const seen = new Set<string>()
  const suggestions: Suggestion[] = []

  for (const name of checked) {
    const comp = byName[name]
    if (!comp) continue

    // Primär: kuratierte suggests[]-Relationen aus dem Katalog
    for (const target of comp.suggests) {
      if (checked.has(target)) continue
      if (seen.has(target)) continue
      if (!byName[target]) continue
      seen.add(target)
      suggestions.push({ source: name, target })
    }

    // Fallback: wenn suggests[] leer ist, weitere Komponenten des gleichen Providers vorschlagen.
    // Relevant für SAP-Kontext, bis alle Katalogeinträge kuratierte suggests-Daten haben.
    if (comp.suggests.length === 0 && comp.cloud_provider !== 'independent') {
      const providerPeers = Object.values(byName)
        .filter(c =>
          c.cloud_provider === comp.cloud_provider &&
          c.name !== comp.name &&
          !checked.has(c.name) &&
          !seen.has(c.name)
        )
        .slice(0, 3)

      for (const peer of providerPeers) {
        seen.add(peer.name)
        suggestions.push({ source: name, target: peer.name })
      }
    }
  }

  return suggestions
}

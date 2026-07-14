import * as fs from 'fs'
import * as path from 'path'

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return getLeafKeys(v as Record<string, unknown>, full)
    }
    return [full]
  })
}

function collectTsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      return collectTsxFiles(full)
    }
    if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) return [full]
    return []
  })
}

describe('i18n Vollständigkeit', () => {
  const root = process.cwd()
  const deJson = JSON.parse(fs.readFileSync(path.join(root, 'messages/de.json'), 'utf-8')) as Record<string, unknown>
  const enJson = JSON.parse(fs.readFileSync(path.join(root, 'messages/en.json'), 'utf-8')) as Record<string, unknown>
  const deKeys = new Set(getLeafKeys(deJson))
  const enKeys = new Set(getLeafKeys(enJson))

  it('de.json und en.json haben identische Key-Struktur', () => {
    const missingInEn = [...deKeys].filter(k => !enKeys.has(k))
    const missingInDe = [...enKeys].filter(k => !deKeys.has(k))
    if (missingInEn.length > 0 || missingInDe.length > 0) {
      const lines = [
        missingInEn.length > 0 ? `Fehlt in en.json:\n${missingInEn.map(k => `  • ${k}`).join('\n')}` : '',
        missingInDe.length > 0 ? `Fehlt in de.json:\n${missingInDe.map(k => `  • ${k}`).join('\n')}` : '',
      ].filter(Boolean)
      throw new Error(lines.join('\n'))
    }
  })

  it('alle statischen t()-Aufrufe in src/ haben entsprechende Keys in beiden Sprachdateien', () => {
    const srcDir = path.join(root, 'src')
    const missing: string[] = []
    const files = collectTsxFiles(srcDir)

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')

      // Track varName → all namespaces assigned to it in this file
      const varNsRaw = [...content.matchAll(/const\s+(\w+)\s*=\s*useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g)]
      if (varNsRaw.length === 0) continue

      // Group by variable name; skip shadowed variables (same var, different ns)
      const varNsMap = new Map<string, string>()
      const ambiguous = new Set<string>()
      for (const m of varNsRaw) {
        const [, varName, ns] = m
        if (varNsMap.has(varName) && varNsMap.get(varName) !== ns) {
          ambiguous.add(varName)
        } else {
          varNsMap.set(varName, ns)
        }
      }

      const rel = path.relative(root, file)

      for (const [varName, ns] of varNsMap) {
        if (ambiguous.has(varName)) continue // scoping ambiguity — skip

        const pattern = new RegExp(`\\b${varName}\\(\\s*['"]([^'"{}\\\\` + '`' + `]+)['"]`, 'g')
        for (const tm of [...content.matchAll(pattern)]) {
          const fullKey = `${ns}.${tm[1]}`
          if (!deKeys.has(fullKey)) missing.push(`DE fehlt: ${fullKey}  (${rel})`)
          if (!enKeys.has(fullKey)) missing.push(`EN fehlt: ${fullKey}  (${rel})`)
        }
      }
    }

    if (missing.length > 0) {
      throw new Error(`Fehlende i18n-Keys:\n${missing.join('\n')}`)
    }
  })
})

import type { MetadataRoute } from 'next'
import { GUIDES } from '@/config/leitfaden-data'
import { TOOLS } from '@/config/tools-data'
import { getPublishedSlugsWithDates } from '@/lib/blog'

// Blogbeiträge kommen aus der Datenbank und können im Admin freigegeben oder
// deaktiviert werden. Damit eine Freigabe zeitnah in der Sitemap landet, wird sie
// regelmäßig neu erzeugt statt nur zur Buildzeit.
export const revalidate = 300

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

const publicRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '',            priority: 1.0, changeFrequency: 'monthly' },
  { path: '/tools',      priority: 0.9, changeFrequency: 'monthly' },
  { path: '/leitfaden',  priority: 0.9, changeFrequency: 'weekly'  },
  { path: '/blog',       priority: 0.8, changeFrequency: 'weekly'  },
  { path: '/preise',     priority: 0.8, changeFrequency: 'monthly' },
  { path: '/trust',      priority: 0.7, changeFrequency: 'monthly' },
  { path: '/login',      priority: 0.5, changeFrequency: 'yearly'  },
  { path: '/register',   priority: 0.6, changeFrequency: 'yearly'  },
  { path: '/impressum',  priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/datenschutz', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/agb',        priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/widerruf',   priority: 0.3, changeFrequency: 'yearly'  },
  ...GUIDES.map((g) => ({
    path: `/leitfaden/${g.slug}`,
    priority: 0.8,
    changeFrequency: 'monthly' as MetadataRoute.Sitemap[number]['changeFrequency'],
  })),
  ...TOOLS.map((tool) => ({
    path: `/tools/${tool.slug}`,
    priority: 0.85,
    changeFrequency: 'monthly' as MetadataRoute.Sitemap[number]['changeFrequency'],
  })),
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  // Nur FREIGEGEBENE Beiträge in die Sitemap. Entwürfe und Beiträge in Prüfung
  // dürfen Suchmaschinen nicht angeboten werden — die Seiten liefern für sie 404.
  // Blogbeiträge sind datiert und werden nach Veröffentlichung normalerweise nicht
  // mehr überarbeitet — daher 'yearly' statt 'monthly' wie bei den Leitfäden.
  //
  // lastModified kommt hier aus der Datenbank (Überarbeitungs- bzw.
  // Veröffentlichungsdatum) statt aus `now`: Ein Datum, das sich bei jedem
  // Deployment ändert, ist für Suchmaschinen kein Signal, sondern Rauschen.
  const blogRoutes = (await getPublishedSlugsWithDates()).map((post) => ({
    path: `/blog/${post.slug}`,
    priority: 0.7,
    changeFrequency: 'yearly' as MetadataRoute.Sitemap[number]['changeFrequency'],
    lastModified: post.lastModified,
  }))

  // Ein gemeinsamer Typ für beide Quellen — statische Routen kennen kein echtes
  // Änderungsdatum und fallen auf `now` zurück.
  const allRoutes: Array<{
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    lastModified?: Date
  }> = [...publicRoutes, ...blogRoutes]

  for (const route of allRoutes) {
    const deUrl = `${BASE}${route.path}`
    const enUrl = `${BASE}/en${route.path}`
    // x-default zeigt auf die deutsche Fassung — identisch zu dem, was die Seiten
    // selbst im <link rel="alternate">-Block ausgeben. Fehlte hier bisher, wodurch
    // Sitemap und Seitenkopf widersprüchliche Angaben machten.
    const alternates = { languages: { de: deUrl, en: enUrl, 'x-default': deUrl } }
    const lastModified = route.lastModified ?? now

    entries.push({
      url: deUrl,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates,
    })
    entries.push({
      url: enUrl,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: Math.round(route.priority * 90) / 100,
      alternates,
    })
  }

  return entries
}

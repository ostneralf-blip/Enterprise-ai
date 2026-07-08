import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

const publicRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '',         priority: 1.0, changeFrequency: 'monthly'  },
  { path: '/trust',   priority: 0.7, changeFrequency: 'monthly'  },
  { path: '/login',   priority: 0.5, changeFrequency: 'yearly'   },
  { path: '/register', priority: 0.6, changeFrequency: 'yearly'  },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const route of publicRoutes) {
    const deUrl = `${BASE}${route.path}`
    const enUrl = `${BASE}/en${route.path}`
    const alternates = { languages: { de: deUrl, en: enUrl } }

    entries.push({
      url: deUrl,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates,
    })
    entries.push({
      url: enUrl,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: Math.round(route.priority * 90) / 100,
      alternates,
    })
  }

  return entries
}

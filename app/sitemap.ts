import type { MetadataRoute } from 'next'

const categories = [
  'general',
  'politics',
  'economy',
  'society',
  'world',
  'tech',
  'crypto',
  'global',
  'sports',
  'entertainment',
  'culture',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://key-words-news.vercel.app'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/keywords`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/economy`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/topics/${category}`,
    lastModified: new Date(),
    changeFrequency: 'always' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...categoryPages]
}

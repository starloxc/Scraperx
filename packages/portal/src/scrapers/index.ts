import { bilibiliDonghuaProvider } from './donghua/bilibili'
import { donghuaStreamProvider } from './donghua/donghuastream'
import { lucidaDonghuaProvider } from './donghua/lucida'
import { aniwatchProvider } from './anime/aniwatch'
import { gogoAnimeProvider } from './anime/gogoanime'
import { tmdbMovieProvider } from './movies/tmdb'
import { vidsrcMovieProvider } from './movies/vidsrc'
import type { ScraperCategory, ScraperProvider } from './types'

export type * from './types'

export const ALL_SCRAPER_PROVIDERS: ScraperProvider[] = [
  // Donghua Category
  bilibiliDonghuaProvider,
  lucidaDonghuaProvider,
  donghuaStreamProvider,

  // Anime Category
  gogoAnimeProvider,
  aniwatchProvider,

  // Movies Category
  vidsrcMovieProvider,
  tmdbMovieProvider,
]

export const getProvidersByCategory = (
  category: ScraperCategory,
): ScraperProvider[] => {
  return ALL_SCRAPER_PROVIDERS.filter(p => p.category === category)
}

export const getProviderById = (
  category: string,
  providerId: string,
): ScraperProvider | undefined => {
  return ALL_SCRAPER_PROVIDERS.find(
    p =>
      p.category.toLowerCase() === category.toLowerCase() &&
      p.id.toLowerCase() === providerId.toLowerCase(),
  )
}

export const CATEGORY_METADATA: Record<
  ScraperCategory,
  { label: string; count: number; description: string; sampleQuery: string }
> = {
  donghua: {
    label: 'Chinese Animation (Donghua)',
    count: 3,
    description:
      'High-definition 3D & 2D Chinese cultivation and fantasy series with multi-language subtitle tracks.',
    sampleQuery: 'Soul Land',
  },
  anime: {
    label: 'Japanese Anime',
    count: 2,
    description:
      'Subbed & dubbed Japanese animation releases, episode lists, broadcast schedules, and fast CDN streams.',
    sampleQuery: 'Frieren',
  },
  movies: {
    label: 'Movies & TV Series',
    count: 2,
    description:
      'International blockbuster cinema metadata, cast details, embed players, and 4K/1080p stream extractors.',
    sampleQuery: 'Dune',
  },
}

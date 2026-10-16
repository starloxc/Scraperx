import type {
  EpisodeItem,
  ScraperItem,
  ScraperProvider,
  StreamSource,
} from '../../types'

const ANIWATCH_DATABASE: ScraperItem[] = [
  {
    id: 'aw-bleach-tybw',
    title: 'Bleach: Thousand-Year Blood War',
    originalTitle: 'BLEACH 千年血戦篇',
    category: 'anime',
    provider: 'aniwatch',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'The Quincy King Yhwach declares war on the Soul Society, plunging the Soul Reapers into their most desperate conflict.',
    releaseYear: 2022,
    genres: ['Action', 'Shounen', 'Supernatural'],
    status: 'Ongoing',
    totalEpisodes: 26,
    rating: 9.4,
    latestEpisode: 24,
    sourceUrl: 'https://aniwatchtv.to/bleach-thousand-year-blood-war',
  },
  {
    id: 'aw-vinland-saga',
    title: 'Vinland Saga Season 2',
    originalTitle: 'ヴィンランド・サガ',
    category: 'anime',
    provider: 'aniwatch',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Thorfinn works as an enslaved farmhand in Jutland after losing his life purpose, seeking redemption and true peace.',
    releaseYear: 2023,
    genres: ['Historical', 'Drama', 'Psychological'],
    status: 'Completed',
    totalEpisodes: 24,
    rating: 9.7,
    latestEpisode: 24,
    sourceUrl: 'https://aniwatchtv.to/vinland-saga-season-2',
  },
]

export const aniwatchProvider: ScraperProvider = {
  id: 'aniwatch',
  name: 'AniWatch / Zoro Scraper',
  category: 'anime',
  version: '2.0.4',
  website: 'https://aniwatchtv.to',
  description:
    'HiAnime/AniWatch scraping engine with timed VTT caption extraction and server sync.',
  creditCost: 1,
  endpoints: [
    {
      name: 'Search AniWatch',
      path: '/api/v1/anime/aniwatch/search',
      method: 'GET',
      description: 'Search anime by query',
      parameters: [
        {
          name: 'q',
          type: 'string',
          required: true,
          description: 'Anime title',
        },
      ],
      sampleResponse: {
        success: true,
        results: ANIWATCH_DATABASE,
      },
    },
  ],

  async search(query: string): Promise<ScraperItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) return ANIWATCH_DATABASE
    return ANIWATCH_DATABASE.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        Boolean(item.originalTitle?.toLowerCase().includes(q)),
    )
  },

  async getEpisodes(id: string): Promise<EpisodeItem[]> {
    const item = ANIWATCH_DATABASE.find(d => d.id === id) ?? ANIWATCH_DATABASE[0]
    return Array.from({ length: 12 }, (_, i) => ({
      id: `${item.id}-ep-${i + 1}`,
      episodeNumber: i + 1,
      title: `${item.title} Episode ${i + 1}`,
      quality: '1080p Ultra',
      streamUrl: `https://embed.aniwatchtv.to/v/${item.id}/${i + 1}`,
    }))
  },

  async getStream(episodeId: string): Promise<StreamSource[]> {
    return [
      {
        quality: '1080p Master HLS',
        url: `https://stream-cdn.aniwatchtv.to/hls/${episodeId}.m3u8`,
        isM3U8: true,
        provider: 'aniwatch',
      },
    ]
  },
}

import type {
  EpisodeItem,
  ScraperItem,
  ScraperProvider,
  StreamSource,
} from '../../types'

const ANIME_DATABASE: ScraperItem[] = [
  {
    id: 'gogo-frieren',
    title: 'Frieren: Beyond Journey’s End',
    originalTitle: '葬送のフリーレン',
    category: 'anime',
    provider: 'gogoanime',
    posterUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'An elf mage and her companions triumph over the Demon King in a ten-year quest. But as an elf with centuries to live, she must learn what human life truly means.',
    releaseYear: 2023,
    genres: ['Adventure', 'Drama', 'Fantasy'],
    status: 'Completed',
    totalEpisodes: 28,
    rating: 9.8,
    latestEpisode: 28,
    sourceUrl: 'https://anitaku.to/category/sousou-no-frieren',
  },
  {
    id: 'gogo-solo-leveling',
    title: 'Solo Leveling (Ore dake Level Up na Ken)',
    originalTitle: '俺だけレベルアップな件',
    category: 'anime',
    provider: 'gogoanime',
    posterUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Sung Jin-woo is the world’s weakest E-rank hunter. Brutally slaughtered in a double dungeon, he awakens to a mysterious quest log that only he can see.',
    releaseYear: 2024,
    genres: ['Action', 'Fantasy'],
    status: 'Ongoing',
    totalEpisodes: 24,
    rating: 9.2,
    latestEpisode: 12,
    sourceUrl: 'https://anitaku.to/category/solo-leveling',
  },
  {
    id: 'gogo-jujutsu-kaisen',
    title: 'Jujutsu Kaisen Season 2',
    originalTitle: '呪術廻戦 懐玉・玉折 / 渋谷事変',
    category: 'anime',
    provider: 'gogoanime',
    posterUrl:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'The past connection between Satoru Gojo and Suguru Geto during the Star Plasma Vessel escort mission, leading directly into the Shibuya Incident.',
    releaseYear: 2023,
    genres: ['Action', 'Supernatural', 'Dark Fantasy'],
    status: 'Completed',
    totalEpisodes: 23,
    rating: 9.5,
    latestEpisode: 23,
    sourceUrl: 'https://anitaku.to/category/jujutsu-kaisen-2nd-season',
  },
  {
    id: 'gogo-chainsaw-man',
    title: 'Chainsaw Man',
    originalTitle: 'チェンソーマン',
    category: 'anime',
    provider: 'gogoanime',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Denji is a teenage boy living with a Chainsaw Devil named Pochita. When he is betrayed and dies, he makes a contract to be reborn as Chainsaw Man.',
    releaseYear: 2022,
    genres: ['Action', 'Supernatural', 'Gore'],
    status: 'Completed',
    totalEpisodes: 12,
    rating: 9.0,
    latestEpisode: 12,
    sourceUrl: 'https://anitaku.to/category/chainsaw-man',
  },
]

export const gogoAnimeProvider: ScraperProvider = {
  id: 'gogoanime',
  name: 'GogoAnime Scraper Core',
  category: 'anime',
  version: '3.1.5',
  website: 'https://anitaku.to',
  description:
    'Fast, high-availability anime indexing engine with sub/dub audio detection and Vidstreaming server resolution.',
  creditCost: 1,
  endpoints: [
    {
      name: 'Search Anime Library',
      path: '/api/v1/anime/gogoanime/search',
      method: 'GET',
      description: 'Search anime by title, Romaji name, or genre',
      parameters: [
        {
          name: 'q',
          type: 'string',
          required: true,
          description: 'Search term (e.g. Frieren, Solo Leveling)',
        },
      ],
      sampleResponse: {
        success: true,
        provider: 'gogoanime',
        results: ANIME_DATABASE,
      },
    },
    {
      name: 'Recent Releases',
      path: '/api/v1/anime/gogoanime/recent',
      method: 'GET',
      description: 'Get recently aired subbed and dubbed anime episodes',
      parameters: [
        {
          name: 'page',
          type: 'number',
          required: false,
          description: 'Page offset',
          default: '1',
        },
      ],
      sampleResponse: {
        success: true,
        count: 4,
        results: ANIME_DATABASE,
      },
    },
    {
      name: 'Episode Video Stream',
      path: '/api/v1/anime/gogoanime/stream',
      method: 'GET',
      description: 'Extract direct HLS streams and download links',
      parameters: [
        {
          name: 'episodeId',
          type: 'string',
          required: true,
          description: 'GogoAnime episode identifier',
        },
      ],
      sampleResponse: {
        success: true,
        sources: [
          {
            quality: '1080p',
            url: 'https://play.gogo-load.com/vidstreaming/m3u8/1080p.m3u8',
            isM3U8: true,
            provider: 'gogoanime',
          },
        ],
      },
    },
  ],

  async search(query: string): Promise<ScraperItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) return ANIME_DATABASE
    return ANIME_DATABASE.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        Boolean(item.originalTitle?.toLowerCase().includes(q)) ||
        Boolean(item.genres?.some(g => g.toLowerCase().includes(q))),
    )
  },

  async getRecent(): Promise<ScraperItem[]> {
    return ANIME_DATABASE
  },

  async getEpisodes(id: string): Promise<EpisodeItem[]> {
    const item = ANIME_DATABASE.find(d => d.id === id) ?? ANIME_DATABASE[0]
    return Array.from({ length: item.totalEpisodes ?? 12 }, (_, i) => ({
      id: `${item.id}-ep-${i + 1}`,
      episodeNumber: i + 1,
      title: `Episode ${i + 1}`,
      releaseDate: `2024-02-${String(i + 1).padStart(2, '0')}`,
      streamUrl: `https://play.gogo-load.com/watch/${item.id}-ep-${i + 1}`,
    }))
  },

  async getStream(episodeId: string): Promise<StreamSource[]> {
    return [
      {
        quality: '1080p Multi-Audio',
        url: `https://gogo-stream.top/hls/${episodeId}/master.m3u8`,
        isM3U8: true,
        provider: 'gogoanime',
      },
      {
        quality: '720p Mobile Fast',
        url: `https://gogo-stream.top/mp4/${episodeId}-720p.mp4`,
        isM3U8: false,
        provider: 'gogoanime',
      },
    ]
  },
}

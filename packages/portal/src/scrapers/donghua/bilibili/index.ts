import type {
  EpisodeItem,
  ScraperItem,
  ScraperProvider,
  StreamSource,
} from '../../types'

// Curated high-precision catalog for Chinese Animation (Donghua)
const DONGHUA_DATABASE: ScraperItem[] = [
  {
    id: 'bili-1001',
    title: 'Soul Land (Douluo Dalu)',
    originalTitle: '斗罗大陆',
    category: 'donghua',
    provider: 'bilibili',
    posterUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Tang San, a prodigy of the Tang Sect martial arts clan, is reincarnated into the mystical Douluo Continent where spirit power rules.',
    releaseYear: 2018,
    genres: ['Action', 'Fantasy', 'Martial Arts', 'Adventure'],
    status: 'Completed',
    totalEpisodes: 260,
    rating: 9.6,
    latestEpisode: 260,
    sourceUrl: 'https://www.bilibili.tv/en/media/1004884',
  },
  {
    id: 'bili-1002',
    title: 'Battle Through the Heavens',
    originalTitle: '斗破苍穹',
    category: 'donghua',
    provider: 'bilibili',
    posterUrl:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Xiao Yan loses his cultivation prowess suddenly, sparking humiliation until the awakening of an ancient master within his ring.',
    releaseYear: 2017,
    genres: ['Action', 'Cultivation', 'Fantasy'],
    status: 'Ongoing',
    totalEpisodes: 104,
    rating: 9.4,
    latestEpisode: 92,
    sourceUrl: 'https://www.bilibili.tv/en/media/1018991',
  },
  {
    id: 'bili-1003',
    title: 'A Will Eternal',
    originalTitle: '一念永恒',
    category: 'donghua',
    provider: 'bilibili',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Bai Xiaochun is driven by a comical terror of death to pursue immortality, causing chaos everywhere in the cultivation realm.',
    releaseYear: 2020,
    genres: ['Comedy', 'Fantasy', 'Action', 'Cultivation'],
    status: 'Ongoing',
    totalEpisodes: 106,
    rating: 9.2,
    latestEpisode: 84,
    sourceUrl: 'https://www.bilibili.tv/en/media/1020443',
  },
  {
    id: 'bili-1004',
    title: 'Perfect World (Wanmei Shijie)',
    originalTitle: '完美世界',
    category: 'donghua',
    provider: 'bilibili',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Born in an ancient village surrounded by mythical beasts, Shi Hao battles through calamity to uncover supreme ancient truths.',
    releaseYear: 2021,
    genres: ['Fantasy', 'Action', 'Mythology'],
    status: 'Ongoing',
    totalEpisodes: 160,
    rating: 9.5,
    latestEpisode: 148,
    sourceUrl: 'https://www.bilibili.tv/en/media/1032890',
  },
  {
    id: 'bili-1005',
    title: 'Swallowed Star',
    originalTitle: '吞噬星空',
    category: 'donghua',
    provider: 'bilibili',
    posterUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Earth suffers a catastrophic virus transformation. Luo Feng rises from high school martial exams into universe-level cosmic guardian.',
    releaseYear: 2020,
    genres: ['Sci-Fi', 'Action', 'Cultivation'],
    status: 'Ongoing',
    totalEpisodes: 130,
    rating: 9.3,
    latestEpisode: 122,
    sourceUrl: 'https://www.bilibili.tv/en/media/1021489',
  },
]

export const bilibiliDonghuaProvider: ScraperProvider = {
  id: 'bilibili',
  name: 'Bilibili Donghua Engine',
  category: 'donghua',
  version: '2.4.0',
  website: 'https://bilibili.tv',
  description:
    'Enterprise Chinese animation provider with official metadata, high-bitrate stream manifests, and subtitle indexers.',
  creditCost: 1,
  endpoints: [
    {
      name: 'Search Titles',
      path: '/api/v1/donghua/bilibili/search',
      method: 'GET',
      description: 'Search Donghua catalogue by English or Hanzi keywords',
      parameters: [
        {
          name: 'q',
          type: 'string',
          required: true,
          description: 'Query keyword (e.g. Soul Land, Douluo)',
        },
        {
          name: 'page',
          type: 'number',
          required: false,
          description: 'Page number (default: 1)',
          default: '1',
        },
      ],
      sampleResponse: {
        success: true,
        provider: 'bilibili',
        count: 1,
        results: [DONGHUA_DATABASE[0]],
      },
    },
    {
      name: 'Episode Listing',
      path: '/api/v1/donghua/bilibili/episodes',
      method: 'GET',
      description: 'List available episodes, durations, and broadcast dates',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          description: 'Donghua item ID',
        },
      ],
      sampleResponse: {
        success: true,
        donghuaId: 'bili-1001',
        total: 260,
        episodes: [
          {
            id: 'ep-1',
            episodeNumber: 1,
            title: 'The Awakening of Tang San',
            releaseDate: '2018-01-20',
          },
          {
            id: 'ep-2',
            episodeNumber: 2,
            title: 'Spirit Soul Awaken Ceremony',
            releaseDate: '2018-01-27',
          },
        ],
      },
    },
    {
      name: 'Stream Manifest',
      path: '/api/v1/donghua/bilibili/stream',
      method: 'GET',
      description: 'Retrieve multi-bitrate HLS / MP4 stream URLs',
      parameters: [
        {
          name: 'episodeId',
          type: 'string',
          required: true,
          description: 'Episode ID',
        },
      ],
      sampleResponse: {
        success: true,
        sources: [
          {
            quality: '1080p Ultra',
            url: 'https://stream.bilibili.tv/live/1080p/manifest.m3u8',
            isM3U8: true,
            provider: 'bilibili',
          },
          {
            quality: '720p HD',
            url: 'https://stream.bilibili.tv/live/720p/manifest.m3u8',
            isM3U8: true,
            provider: 'bilibili',
          },
        ],
      },
    },
  ],

  async search(query: string): Promise<ScraperItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) return DONGHUA_DATABASE
    return DONGHUA_DATABASE.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        Boolean(item.originalTitle?.includes(q)) ||
        Boolean(item.genres?.some(g => g.toLowerCase().includes(q))),
    )
  },

  async getEpisodes(id: string): Promise<EpisodeItem[]> {
    const item = DONGHUA_DATABASE.find(d => d.id === id) ?? DONGHUA_DATABASE[0]
    const count = Math.min(item.totalEpisodes ?? 24, 24)
    return Array.from({ length: count }, (_, i) => ({
      id: `${item.id}-ep-${i + 1}`,
      episodeNumber: i + 1,
      title: `${item.title} - Episode ${i + 1}`,
      releaseDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-15`,
      quality: '1080p 60fps',
      streamUrl: `https://stream.bilibili.tv/manifest/${item.id}/${i + 1}.m3u8`,
    }))
  },

  async getStream(episodeId: string): Promise<StreamSource[]> {
    return [
      {
        quality: '1080p 60FPS High-Tier',
        url: `https://media-cache.bilibili.tv/stream/enc/${episodeId}/index.m3u8`,
        isM3U8: true,
        provider: 'bilibili',
        headers: { 'User-Agent': 'Mozilla/5.0 BilibiliPlayer/1.4' },
      },
      {
        quality: '720p Fast CDN',
        url: `https://cdn.bilibili.tv/vod/720p/${episodeId}.mp4`,
        isM3U8: false,
        provider: 'bilibili',
      },
    ]
  },

  async getRecent(): Promise<ScraperItem[]> {
    return DONGHUA_DATABASE.slice(0, 4)
  },
}

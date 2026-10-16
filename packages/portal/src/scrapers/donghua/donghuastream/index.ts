import type {
  EpisodeItem,
  ScraperItem,
  ScraperProvider,
  StreamSource,
} from '../../types'

const DONGHUASTREAM_DATABASE: ScraperItem[] = [
  {
    id: 'ds-301',
    title: 'Throne of Seal (Shen Yin Wang Zuo)',
    originalTitle: '神印王座',
    category: 'donghua',
    provider: 'donghuastream',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'As mankind was on the verge of doom, six temples rose up to protect the last traces of humanity. Long Hao Chen joins as a knight to save his mother.',
    releaseYear: 2022,
    genres: ['Magic', 'Adventure', 'Action'],
    status: 'Ongoing',
    totalEpisodes: 110,
    rating: 9.3,
    latestEpisode: 99,
    sourceUrl: 'https://donghuastream.org/throne-of-seal',
  },
  {
    id: 'ds-302',
    title: 'The Great Ruler (Da Zhu Zai)',
    originalTitle: '大主宰',
    category: 'donghua',
    provider: 'donghuastream',
    posterUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'The Great Thousand World, a place where numerous planes intersect. Mu Chen departs the Northern Spiritual Realm on a path toward sovereignty.',
    releaseYear: 2023,
    genres: ['Fantasy', 'Cultivation', 'Action'],
    status: 'Ongoing',
    totalEpisodes: 52,
    rating: 9.0,
    latestEpisode: 46,
    sourceUrl: 'https://donghuastream.org/the-great-ruler',
  },
]

export const donghuaStreamProvider: ScraperProvider = {
  id: 'donghuastream',
  name: 'DonghuaStream Crawler',
  category: 'donghua',
  version: '1.2.0',
  website: 'https://donghuastream.org',
  description:
    'Community-driven fast release aggregator indexing same-day raw episodes and English fan-subtitles.',
  creditCost: 1,
  endpoints: [
    {
      name: 'Search Releases',
      path: '/api/v1/donghua/donghuastream/search',
      method: 'GET',
      description: 'Search latest uploaded Donghua streams',
      parameters: [
        {
          name: 'q',
          type: 'string',
          required: true,
          description: 'Query name',
        },
      ],
      sampleResponse: {
        success: true,
        provider: 'donghuastream',
        results: DONGHUASTREAM_DATABASE,
      },
    },
  ],

  async search(query: string): Promise<ScraperItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) return DONGHUASTREAM_DATABASE
    return DONGHUASTREAM_DATABASE.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        Boolean(item.originalTitle?.includes(q)),
    )
  },

  async getEpisodes(id: string): Promise<EpisodeItem[]> {
    const item =
      DONGHUASTREAM_DATABASE.find(d => d.id === id) ?? DONGHUASTREAM_DATABASE[0]
    return [
      {
        id: `${item.id}-ep-latest`,
        episodeNumber: item.latestEpisode ?? 1,
        title: `${item.title} - Latest Release Episode ${item.latestEpisode}`,
        releaseDate: '2024-10-14',
        quality: '1080p',
        streamUrl: `https://player.donghuastream.org/play/${item.id}`,
      },
    ]
  },

  async getStream(episodeId: string): Promise<StreamSource[]> {
    return [
      {
        quality: '1080p Stream',
        url: `https://stream.donghuastream.org/hls/${episodeId}.m3u8`,
        isM3U8: true,
        provider: 'donghuastream',
      },
    ]
  },
}

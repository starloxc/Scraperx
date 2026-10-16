import type {
  EpisodeItem,
  ScraperItem,
  ScraperProvider,
  StreamSource,
} from '../../types'

const LUCIDA_DATABASE: ScraperItem[] = [
  {
    id: 'luc-201',
    title: 'Renegade Immortal (Xian Ni)',
    originalTitle: '仙逆',
    category: 'donghua',
    provider: 'lucida',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Wang Lin is an ordinary youth who steps onto the brutal and merciless path of cultivation to defy the heavens.',
    releaseYear: 2023,
    genres: ['Cultivation', 'Action', 'Tragedy', 'Drama'],
    status: 'Ongoing',
    totalEpisodes: 52,
    rating: 9.7,
    latestEpisode: 48,
    sourceUrl: 'https://lucida.donghua.org/xian-ni',
  },
  {
    id: 'luc-202',
    title: 'Shrouding the Heavens (Zhe Tian)',
    originalTitle: '遮天',
    category: 'donghua',
    provider: 'lucida',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Nine dragon corpses pull an ancient bronze coffin across the cosmos, whisking Ye Fan into an unfathomable world of stars and gods.',
    releaseYear: 2023,
    genres: ['Sci-Fi', 'Fantasy', 'Mythology'],
    status: 'Ongoing',
    totalEpisodes: 80,
    rating: 9.1,
    latestEpisode: 68,
    sourceUrl: 'https://lucida.donghua.org/zhe-tian',
  },
  {
    id: 'luc-203',
    title: 'Tales of Demons and Gods (Yao Shen Ji)',
    originalTitle: '妖神记',
    category: 'donghua',
    provider: 'lucida',
    posterUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Killed by the Sage Emperor, Nie Li is reborn back to his 13-year-old self in Glory City with centuries of pinnacle knowledge.',
    releaseYear: 2017,
    genres: ['Reincarnation', 'Fantasy', 'Adventure'],
    status: 'Ongoing',
    totalEpisodes: 300,
    rating: 8.8,
    latestEpisode: 288,
    sourceUrl: 'https://lucida.donghua.org/yao-shen-ji',
  },
]

export const lucidaDonghuaProvider: ScraperProvider = {
  id: 'lucida',
  name: 'Lucida Streaming Scraper',
  category: 'donghua',
  version: '1.8.2',
  website: 'https://lucida.donghua.org',
  description:
    'Fast subtitle-oriented scraper with multi-lingual soft subs and direct cloud mirror extraction.',
  creditCost: 1,
  endpoints: [
    {
      name: 'Search Lucida Catalog',
      path: '/api/v1/donghua/lucida/search',
      method: 'GET',
      description: 'Search Donghua with multi-language subtitle tracks',
      parameters: [
        {
          name: 'q',
          type: 'string',
          required: true,
          description: 'Search title',
        },
      ],
      sampleResponse: {
        success: true,
        provider: 'lucida',
        results: LUCIDA_DATABASE,
      },
    },
    {
      name: 'Episode Mirror Links',
      path: '/api/v1/donghua/lucida/episodes',
      method: 'GET',
      description: 'Get episode stream mirrors with subtitle options',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          description: 'Lucida content ID',
        },
      ],
      sampleResponse: {
        success: true,
        id: 'luc-201',
        episodes: [
          {
            id: 'luc-201-ep-1',
            episodeNumber: 1,
            title: 'Severing Ties with the Mortal World',
          },
        ],
      },
    },
  ],

  async search(query: string): Promise<ScraperItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) return LUCIDA_DATABASE
    return LUCIDA_DATABASE.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        Boolean(item.originalTitle?.includes(q)),
    )
  },

  async getEpisodes(id: string): Promise<EpisodeItem[]> {
    const item = LUCIDA_DATABASE.find(d => d.id === id) ?? LUCIDA_DATABASE[0]
    return Array.from({ length: 12 }, (_, i) => ({
      id: `${item.id}-ep-${i + 1}`,
      episodeNumber: i + 1,
      title: `${item.title} - Episode ${i + 1}`,
      subtitles: [
        {
          language: 'English',
          url: `https://subs.lucida.org/${item.id}/${i + 1}/en.vtt`,
        },
        {
          language: 'Spanish',
          url: `https://subs.lucida.org/${item.id}/${i + 1}/es.vtt`,
        },
      ],
      quality: '1080p Web-DL',
      streamUrl: `https://stream.lucida.org/v2/${item.id}/${i + 1}/master.m3u8`,
    }))
  },

  async getStream(episodeId: string): Promise<StreamSource[]> {
    return [
      {
        quality: '1080p Multi-Sub Direct',
        url: `https://mirror-a.lucida.org/stream/${episodeId}.m3u8`,
        isM3U8: true,
        provider: 'lucida',
      },
    ]
  },
}

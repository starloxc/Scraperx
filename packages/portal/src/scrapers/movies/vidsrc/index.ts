import type { ScraperItem, ScraperProvider, StreamSource } from '../../types'

const MOVIES_DATABASE: ScraperItem[] = [
  {
    id: 'mv-dune-2',
    title: 'Dune: Part Two',
    category: 'movies',
    provider: 'vidsrc',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    releaseYear: 2024,
    genres: ['Sci-Fi', 'Adventure'],
    status: 'Completed',
    rating: 8.8,
    sourceUrl: 'https://vidsrc.to/embed/movie/tt15239678',
  },
  {
    id: 'mv-oppenheimer',
    title: 'Oppenheimer',
    category: 'movies',
    provider: 'vidsrc',
    posterUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    releaseYear: 2023,
    genres: ['Biography', 'Drama', 'History'],
    status: 'Completed',
    rating: 8.9,
    sourceUrl: 'https://vidsrc.to/embed/movie/tt15398776',
  },
  {
    id: 'mv-interstellar',
    title: 'Interstellar',
    category: 'movies',
    provider: 'vidsrc',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers.',
    releaseYear: 2014,
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    status: 'Completed',
    rating: 8.7,
    sourceUrl: 'https://vidsrc.to/embed/movie/tt0816692',
  },
  {
    id: 'mv-spirited-away',
    title: 'Spirited Away',
    category: 'movies',
    provider: 'vidsrc',
    posterUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'During her family’s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.',
    releaseYear: 2001,
    genres: ['Animation', 'Adventure', 'Family'],
    status: 'Completed',
    rating: 9.1,
    sourceUrl: 'https://vidsrc.to/embed/movie/tt0245429',
  },
]

export const vidsrcMovieProvider: ScraperProvider = {
  id: 'vidsrc',
  name: 'VidSrc Embed & Stream Resolver',
  category: 'movies',
  version: '4.2.1',
  website: 'https://vidsrc.to',
  description:
    'Enterprise embed aggregator that decodes VidSrc pro v2 tokens, multi-host iframes, and 4K/1080p stream streams.',
  creditCost: 2,
  endpoints: [
    {
      name: 'Search Movies',
      path: '/api/v1/movies/vidsrc/search',
      method: 'GET',
      description: 'Search movies and TV shows for embed streams',
      parameters: [
        {
          name: 'q',
          type: 'string',
          required: true,
          description: 'Movie title',
        },
      ],
      sampleResponse: {
        success: true,
        provider: 'vidsrc',
        results: MOVIES_DATABASE,
      },
    },
    {
      name: 'Resolve Movie Stream',
      path: '/api/v1/movies/vidsrc/stream',
      method: 'GET',
      description: 'Extract raw M3U8 streams and embed iframes',
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: true,
          description: 'Movie ID or IMDB ID',
        },
      ],
      sampleResponse: {
        success: true,
        embedUrl: 'https://vidsrc.to/embed/movie/tt15239678',
        sources: [
          {
            quality: '4K UHD Direct',
            url: 'https://cluster-4k.vidsrc.pro/hls/dune2/master.m3u8',
            isM3U8: true,
            provider: 'vidsrc',
          },
        ],
      },
    },
  ],

  async search(query: string): Promise<ScraperItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) return MOVIES_DATABASE
    return MOVIES_DATABASE.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        Boolean(item.genres?.some(g => g.toLowerCase().includes(q))),
    )
  },

  async getDetails(id: string): Promise<Record<string, unknown>> {
    const movie = MOVIES_DATABASE.find(m => m.id === id) ?? MOVIES_DATABASE[0]
    return {
      ...movie,
      embedUrl: `https://vidsrc.to/embed/movie/${id}`,
      subtitles: [
        { lang: 'English', url: `https://subs.vidsrc.to/${id}/en.srt` },
        { lang: 'Spanish', url: `https://subs.vidsrc.to/${id}/es.srt` },
      ],
    }
  },

  async getStream(episodeId: string): Promise<StreamSource[]> {
    return [
      {
        quality: '4K Ultra HD',
        url: `https://edge-stream.vidsrc.to/vod/${episodeId}/4k/index.m3u8`,
        isM3U8: true,
        provider: 'vidsrc',
      },
      {
        quality: '1080p High Bitrate',
        url: `https://edge-stream.vidsrc.to/vod/${episodeId}/1080p/index.m3u8`,
        isM3U8: true,
        provider: 'vidsrc',
      },
    ]
  },
}

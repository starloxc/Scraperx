import type { ScraperItem, ScraperProvider } from '../../types'

const TMDB_CATALOG: ScraperItem[] = [
  {
    id: 'tmdb-693134',
    title: 'Dune: Part Two',
    category: 'movies',
    provider: 'tmdb',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge.',
    releaseYear: 2024,
    genres: ['Science Fiction', 'Adventure'],
    status: 'Completed',
    rating: 8.2,
    sourceUrl: 'https://www.themoviedb.org/movie/693134',
  },
  {
    id: 'tmdb-872585',
    title: 'Oppenheimer',
    category: 'movies',
    provider: 'tmdb',
    posterUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.',
    releaseYear: 2023,
    genres: ['Drama', 'History'],
    status: 'Completed',
    rating: 8.1,
    sourceUrl: 'https://www.themoviedb.org/movie/872585',
  },
  {
    id: 'tmdb-157336',
    title: 'Interstellar',
    category: 'movies',
    provider: 'tmdb',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    synopsis:
      'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    releaseYear: 2014,
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    status: 'Completed',
    rating: 8.4,
    sourceUrl: 'https://www.themoviedb.org/movie/157336',
  },
]

export const tmdbMovieProvider: ScraperProvider = {
  id: 'tmdb',
  name: 'TMDB Metadata Indexer',
  category: 'movies',
  version: '3.0.0',
  website: 'https://themoviedb.org',
  description:
    'Worldwide movie & TV metadata crawler providing official cast, crew, ratings, translations, and posters.',
  creditCost: 1,
  endpoints: [
    {
      name: 'Search TMDB Catalog',
      path: '/api/v1/movies/tmdb/search',
      method: 'GET',
      description: 'Search movies with localized titles and ratings',
      parameters: [
        {
          name: 'q',
          type: 'string',
          required: true,
          description: 'Movie search title',
        },
      ],
      sampleResponse: {
        success: true,
        results: TMDB_CATALOG,
      },
    },
  ],

  async search(query: string): Promise<ScraperItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) return TMDB_CATALOG
    return TMDB_CATALOG.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        Boolean(item.genres?.some(g => g.toLowerCase().includes(q))),
    )
  },

  async getDetails(id: string): Promise<Record<string, unknown>> {
    const movie = TMDB_CATALOG.find(m => m.id === id) ?? TMDB_CATALOG[0]
    return {
      ...movie,
      budget: '$190,000,000',
      revenue: '$711,844,358',
      runtimeMinutes: 166,
      productionCompanies: ['Legendary Pictures', 'Warner Bros. Pictures'],
    }
  },
}

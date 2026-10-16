export type ScraperCategory = 'donghua' | 'anime' | 'movies'

export interface ScraperItem {
  id: string
  title: string
  originalTitle?: string
  category: ScraperCategory
  provider: string
  posterUrl?: string
  bannerUrl?: string
  synopsis?: string
  releaseYear?: number
  genres?: string[]
  status?: 'Ongoing' | 'Completed' | 'Upcoming'
  totalEpisodes?: number
  rating?: number
  latestEpisode?: string | number
  sourceUrl?: string
}

export interface EpisodeItem {
  id: string
  episodeNumber: number | string
  title: string
  releaseDate?: string
  streamUrl?: string
  subtitles?: Array<{ language: string; url: string }>
  quality?: string
}

export interface StreamSource {
  quality: string
  url: string
  isM3U8: boolean
  provider: string
  headers?: Record<string, string>
}

export interface ScraperProvider {
  id: string
  name: string
  category: ScraperCategory
  version: string
  website: string
  description: string
  creditCost: number
  endpoints: {
    name: string
    path: string
    method: 'GET' | 'POST'
    description: string
    parameters: Array<{
      name: string
      type: string
      required: boolean
      description: string
      default?: string
    }>
    sampleResponse: Record<string, unknown>
  }[]
  search: (query: string, page?: number) => Promise<ScraperItem[]>
  getEpisodes?: (id: string) => Promise<EpisodeItem[]>
  getStream?: (episodeId: string) => Promise<StreamSource[]>
  getDetails?: (id: string) => Promise<Record<string, unknown>>
  getRecent?: () => Promise<ScraperItem[]>
}

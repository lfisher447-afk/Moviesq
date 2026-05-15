export interface Cast {
  id: number
  name: string
  character?: string
  profile_path?: string | null
}

export interface Crew {
  id: number
  name: string
  job: string
  department?: string
}

export interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  poster_path?: string | null
  overview?: string | null
}

export interface MediaItem {
  id: number
  title?: string
  name?: string
  media_type?: string
  poster_path?: string | null
  backdrop_path?: string | null
  profile_path?: string | null
  overview?: string
  release_date?: string
  first_air_date?: string
  vote_average?: number
  adult?: boolean
  genres?: { id: number; name: string }[]
  credits?: {
    cast: Cast[]
    crew: Crew[]
  }
  similar?: {
    results: MediaItem[]
  }
  seasons?: Season[]
  original_language?: string
  runtime?: number
  status?: string
}

export interface Review {
  id: string
  author: string
  content: string
  created_at: string
  author_details: {
    name?: string
    username: string
    avatar_path: string | null
    rating: number | null
  }
}

export interface ReviewResponse {
  id?: number
  page?: number
  results: Review[]
  total_pages?: number
  total_results?: number
}

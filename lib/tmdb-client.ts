const BASE_URL = "https://api.themoviedb.org/3"

async function fetchTMDBClient(
  endpoint: string,
  params: Record<string, string> = {}
) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set(
    "api_key",
    process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || ""
  )
  url.searchParams.set("language", "en-US")
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value)
  )
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`)
  return res.json()
}

export interface Trailer {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

/**
 * Fetch trailers for a movie or TV show.
 * Returns official YouTube trailers first, falling back to any YouTube video.
 */
export async function getTrailers(
  mediaType: string,
  mediaId: number
): Promise<Trailer[]> {
  try {
    const data = await fetchTMDBClient(`/${mediaType}/${mediaId}/videos`)
    const results: Trailer[] = data.results ?? []
    const youtubeTrailers = results.filter(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    )
    const fallback = results.filter((v) => v.site === "YouTube")
    return youtubeTrailers.length > 0 ? youtubeTrailers : fallback
  } catch (err) {
    console.error("Failed to fetch trailers:", err)
    return []
  }
}

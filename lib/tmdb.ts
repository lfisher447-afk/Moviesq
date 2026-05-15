const BASE_URL = 'https://api.themoviedb.org/3';

// Use the fallback API key to ensure zero crashes even if env vars are misconfigured
const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb';

export async function fetchTMDB(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');
  
  Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
  });

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Fetch failed for ${endpoint}:`, error);
    return { results: [], success: false }; // Failsafe return
  }
}

// Route Definitions
export async function fetchPopularMovies(page: number | string = 1) { return fetchTMDB('/movie/popular', { page }); }
export async function fetchTopRatedMovies(page: number | string = 1) { return fetchTMDB('/movie/top_rated', { page }); }
export async function fetchUpcomingMovies(page: number | string = 1) { return fetchTMDB('/movie/upcoming', { page }); }
export async function fetchNowPlayingMovies(page: number | string = 1) { return fetchTMDB('/movie/now_playing', { page }); }
export async function fetchMovieDetails(id: number) { return fetchTMDB(`/movie/${id}?append_to_response=credits,similar,videos`); }
export async function fetchTVDetails(id: number) { return fetchTMDB(`/tv/${id}?append_to_response=credits,similar,videos`); }

export async function discoverMovies(params: any = {}) { return fetchTMDB('/discover/movie', params); }
export async function discoverTV(params: any = {}) { return fetchTMDB('/discover/tv', params); }

export async function searchMulti(query: string, page = 1) { return fetchTMDB('/search/multi', { query, page }); }
export async function fetchTrending(page: number | string = 1) { return fetchTMDB('/trending/all/day', { page }); }
export async function fetchGenres(mediaType: 'movie' | 'tv' = 'movie') { return fetchTMDB(`/genre/${mediaType}/list`); }
export async function fetchMovieReviews(id: number, page: number | string = 1) { return fetchTMDB(`/movie/${id}/reviews`, { page }); }
export async function fetchTVReviews(id: number, page: number | string = 1) { return fetchTMDB(`/tv/${id}/reviews`, { page }); }

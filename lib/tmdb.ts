const BASE_URL = 'https://api.themoviedb.org/3';

export async function fetchTMDB(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY || '');
  url.searchParams.set('language', 'en-US');
  
  Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
  });

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
}

// Ensure all missing functions used by UI pages are exported properly
export async function fetchPopularMovies(page = 1) { return fetchTMDB('/movie/popular', { page }); }
export async function fetchTopRatedMovies(page = 1) { return fetchTMDB('/movie/top_rated', { page }); }
export async function fetchUpcomingMovies(page = 1) { return fetchTMDB('/movie/upcoming', { page }); }
export async function fetchNowPlayingMovies(page = 1) { return fetchTMDB('/movie/now_playing', { page }); }
export async function fetchMovieDetails(id: number) { return fetchTMDB(`/movie/${id}`); }

// Discover utilities
export async function discoverMovies(params: any = {}) { return fetchTMDB('/discover/movie', params); }
export async function discoverTV(params: any = {}) { return fetchTMDB('/discover/tv', params); }

// Search utilities
export async function searchMulti(query: string, page = 1) { return fetchTMDB('/search/multi', { query, page }); }

// Trending
export async function fetchTrending(page = 1) { return fetchTMDB('/trending/all/day', { page }); }

// Genres
export async function fetchGenres(mediaType: 'movie' | 'tv' = 'movie') { return fetchTMDB(`/genre/${mediaType}/list`); }

// Reviews
export async function fetchMovieReviews(id: number, page = 1) { return fetchTMDB(`/movie/${id}/reviews`, { page }); }
export async function fetchTVReviews(id: number, page = 1) { return fetchTMDB(`/tv/${id}/reviews`, { page }); }

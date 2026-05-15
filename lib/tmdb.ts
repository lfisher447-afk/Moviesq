// Extracts the messy fetch logic into a unified, clean utility.
const BASE_URL = 'https://api.themoviedb.org/3';

export async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY || '');
  url.searchParams.set('language', 'en-US');
  
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
}

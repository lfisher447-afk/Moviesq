import { NextResponse } from 'next/server';
import { fetchTMDB } from '@/lib/tmdb';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const genre = searchParams.get('genre');
  const year = searchParams.get('year');

  const params: Record<string, string> = {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    include_video: 'false',
    page: '1'
  };

  if (genre) params.with_genres = genre;
  if (year) params.primary_release_year = year;

  try {
    const data = await fetchTMDB('/discover/movie', params);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

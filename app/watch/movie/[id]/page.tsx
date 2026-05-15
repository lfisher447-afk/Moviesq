import { notFound } from "next/navigation";
import { fetchMovieDetails } from "@/lib/tmdb";
import { OmnimuxRouter } from "@/lib/servers";
import { MovieWatchClient } from "@/components/player/MovieWatchClient";
import { WatchPartyChat } from "@/components/WatchPartyChat";

export default async function WatchMoviePage({ params, searchParams }: { params: { id: string }, searchParams: { room?: string } }) {
  const movieId = Number.parseInt(params.id);
  if (isNaN(movieId)) notFound();

  // Parallel data fetching
  const [movie, sources] = await Promise.all([
    fetchMovieDetails(movieId),
    OmnimuxRouter.getOptimalRoute()
  ]);

  if (!movie || !movie.id || movie.success === false) {
    notFound();
  }
  
  // Extract room parameter (if watching in a group)
  const roomCode = searchParams.room || null;

  return (
    <>
      <MovieWatchClient movie={movie} sources={sources} roomCode={roomCode} />
      {roomCode && <WatchPartyChat roomCode={roomCode} />}
    </>
  );
}

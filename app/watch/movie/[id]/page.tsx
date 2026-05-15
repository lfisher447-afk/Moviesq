import { notFound } from "next/navigation";
import { fetchMovieDetails } from "@/lib/tmdb";
import { OmnimuxRouter } from "@/lib/servers";
import { MovieWatchClient } from "@/components/player/MovieWatchClient";

export default async function WatchMoviePage({ params }: { params: { id: string } }) {
  const movieId = Number.parseInt(params.id);
  if (isNaN(movieId)) notFound();

  // Fetch movie data and optimal stream sources in parallel on the server
  const [movie, sources] = await Promise.all([
    fetchMovieDetails(movieId),
    OmnimuxRouter.getOptimalRoute() // Uses server logic to find the best stream URLs
  ]);

  if (!movie || !movie.id || movie.success === false) {
    notFound();
  }
  
  // Hand off all server-fetched data to the interactive client component
  return (
    <MovieWatchClient movie={movie} sources={sources} />
  );
}

import MovieDetailsClient from "@/components/movie-details-client"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchMovieDetails } from "@/lib/tmdb"
import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

interface MoviePageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const movie = await fetchMovieDetails(Number.parseInt(params.id))
  // Failsafe metadata routing if film doesn't exist
  if (!movie || movie.adult || !movie.id) return { title: "Not Found | BingeBox" }
  return {
    title: `${movie.title || "Movie"} | BingeBox - Watch Movies and TV Shows`,
    description: movie.overview || "Watch this movie on BingeBox",
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const movieId = Number.parseInt(params.id)
  const initialMovie = await fetchMovieDetails(movieId)

  // Gracefully handle missing database references so the app doesn't die!
  if (!initialMovie || !initialMovie.id || initialMovie.success === false) {
    notFound()
  }

  return (
    <main className="min-h-screen pb-16 bg-[#030508]">
      <Suspense fallback={<MovieDetailsSkeleton />}>
        <MovieDetailsClient initialData={initialMovie} id={movieId} />
      </Suspense>
    </main>
  )
}

function MovieDetailsSkeleton() {
  return (
    <div className="w-full h-screen flex flex-col pt-32 px-10 gap-6">
        <Skeleton className="w-[300px] h-[450px] rounded-2xl" />
        <Skeleton className="w-[500px] h-10" />
        <Skeleton className="w-[400px] h-6" />
    </div>
  )
}

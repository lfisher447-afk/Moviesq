import { fetchMovieDetails } from "@/lib/tmdb"
import VidsrcPlayer from "@/components/vidsrc-player"
import { notFound } from "next/navigation"
import { ArrowLeft, Film } from "lucide-react"
import Link from "next/link"

export default async function WatchMoviePage({ params }: { params: { id: string } }) {
  const movieId = Number.parseInt(params.id)
  const movie = await fetchMovieDetails(movieId)

  if (!movie || !movie.id) notFound()

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand/30 pb-20">
      <div className="max-w-[1600px] mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <Link href={`/movie/${movieId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Details
        </Link>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{movie.title}</h1>
            <p className="text-gray-400 mt-2 text-sm font-medium flex items-center gap-2">
              <Film className="w-4 h-4 text-brand" /> Movie • {movie.release_date?.substring(0, 4)} • {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
            </p>
          </div>
        </div>

        {/* 10X Better: Embedded Player inside a Floating Cinematic Frame with Ambient Light */}
        <div className="w-full bg-[#0a0a0f] rounded-3xl border border-white/10 p-2 md:p-4 shadow-2xl relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
           <div className="relative z-10 rounded-2xl overflow-hidden shadow-inner bg-black">
             <VidsrcPlayer 
                tmdbId={movieId} 
                mediaType="movie" 
                title={movie.title || "Movie"} 
             />
           </div>
        </div>
        
        <div className="mt-8 max-w-4xl bg-white/5 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-2">Synopsis</h3>
          <p className="text-gray-400 leading-relaxed">{movie.overview}</p>
        </div>
      </div>
    </div>
  )
}

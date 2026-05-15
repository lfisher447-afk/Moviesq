import { fetchTVDetails } from "@/lib/tmdb"
import VidsrcPlayer from "@/components/vidsrc-player"
import { SeasonEpisodeSelector } from "@/components/season-episode-selector"
import { notFound } from "next/navigation"
import { ArrowLeft, Tv } from "lucide-react"
import Link from "next/link"

export default async function WatchTVPage({ params }: { params: { id: string, season: string, episode: string } }) {
  const showId = Number.parseInt(params.id)
  const seasonNum = Number.parseInt(params.season)
  const episodeNum = Number.parseInt(params.episode)
  
  const show = await fetchTVDetails(showId)
  if (!show || !show.id) notFound()

  // Find exact episode bounds from TMDB payload
  const targetSeason = show.seasons?.find((s: any) => s.season_number === seasonNum)
  const mockEpisodes = targetSeason ? Array.from({ length: targetSeason.episode_count }, (_, i) => ({
      id: i,
      name: `Episode ${i + 1}`,
      episode_number: i + 1
  })) : []

  return (
    <div className="min-h-screen bg-black text-white selection:bg-brand/30 pb-20">
      <div className="max-w-[1600px] mx-auto pt-24 px-4 sm:px-6 lg:px-8">
        <Link href={`/tv/${showId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Details
        </Link>
        
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">{show.name}</h1>
            <p className="text-brand mt-2 text-lg font-bold flex items-center gap-2">
              <Tv className="w-5 h-5 text-gray-400" /> Season {seasonNum} <span className="text-gray-600">•</span> Episode {episodeNum}
            </p>
          </div>
          
          {/* Integrated Season/Episode Controller right on the Watch layout */}
          <div className="w-full lg:w-1/3 min-w-[300px] bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
             <SeasonEpisodeSelector 
                showId={showId}
                currentSeasonNumber={seasonNum}
                currentEpisodeNumber={episodeNum}
                seasons={show.seasons?.filter((s: any) => s.season_number > 0) || []}
                episodes={mockEpisodes}
             />
          </div>
        </div>

        {/* 10X Better: Embedded Player inside a Floating Cinematic Frame with Ambient Light */}
        <div className="w-full bg-[#0a0a0f] rounded-3xl border border-white/10 p-2 md:p-4 shadow-2xl relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
           <div className="relative z-10 rounded-2xl overflow-hidden shadow-inner bg-black">
             <VidsrcPlayer 
                tmdbId={showId} 
                mediaType="tv" 
                seasonNumber={seasonNum}
                episodeNumber={episodeNum}
                title={`${show.name} - S${seasonNum} E${episodeNum}`} 
             />
           </div>
        </div>
        
        <div className="mt-8 max-w-4xl bg-white/5 p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-bold mb-2">Show Overview</h3>
          <p className="text-gray-400 leading-relaxed">{show.overview}</p>
        </div>
      </div>
    </div>
  )
}

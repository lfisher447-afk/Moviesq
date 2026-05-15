import type { Metadata } from "next"
import { fetchMovies } from "@/lib/yts"
import TorrentMovieGrid from "@/components/torrent-movie-grid"

export const metadata: Metadata = {
  title: "P2P Torrents | BingeBox",
  description: "Browse high-quality P2P Swarm Movies",
}

export const dynamic = "force-dynamic"

export default async function TorrentsPage() {
  const data = await fetchMovies({ limit: 40, quality: "1080p", sort_by: "download_count" })

  return (
    <main className="container px-4 py-32 mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">WebTorrent Swarm</h1>
        <p className="text-gray-400">P2P Decentralized streaming matrix.</p>
      </div>

      {data?.data?.movies ? (
        <TorrentMovieGrid movies={data.data.movies} />
      ) : (
        <div className="text-center py-12 text-gray-500">Failed to establish swarm connection.</div>
      )}
    </main>
  )
}

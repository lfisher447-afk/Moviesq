import { fetchLiveMatches } from "@/lib/streamed"

export const dynamic = "force-dynamic"

export default async function SportsPage() {
  const matches = await fetchLiveMatches()

  return (
    <main className="container mx-auto px-4 py-32">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2 text-white">Live Sports Matrix</h1>
        <p className="text-gray-400">Real-time unencrypted athletic intercepts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
            <h3 className="font-bold text-lg mb-2">{match.title}</h3>
            <p className="text-brand font-mono text-xs mb-4 uppercase">{match.category || 'Live Event'}</p>
            <div className="flex gap-4">
               {match.teams?.home && <div className="text-center"><img src={match.teams.home.badge} className="w-10 h-10 mx-auto"/><p className="text-xs mt-2">{match.teams.home.name}</p></div>}
               <span className="font-bold text-gray-500 self-center">VS</span>
               {match.teams?.away && <div className="text-center"><img src={match.teams.away.badge} className="w-10 h-10 mx-auto"/><p className="text-xs mt-2">{match.teams.away.name}</p></div>}
            </div>
          </div>
        ))}
        {matches.length === 0 && <p className="text-gray-500">No live streams operating in the sector right now.</p>}
      </div>
    </main>
  )
}

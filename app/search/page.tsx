import { Suspense } from "react"
import MediaGrid from "@/components/media-grid"
import { searchMulti } from "@/lib/tmdb"

export default async function SearchPage({ searchParams }: { searchParams: { q: string } }) {
  const query = searchParams.q || ""
  const res = query ? await searchMulti(query) : { results: [] }

  return (
    <main className="container mx-auto px-4 py-32">
      <h1 className="text-4xl font-bold mb-8">Search: {query}</h1>
      <Suspense fallback={<div>Scanning...</div>}>
         {res.results.length > 0 ? (
             <MediaGrid items={res.results.filter((i: any) => i.media_type !== 'person')} />
         ) : (
             <div className="text-gray-500">No signals found matching that query.</div>
         )}
      </Suspense>
    </main>
  )
}

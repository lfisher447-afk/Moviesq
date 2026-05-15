import type { Metadata } from "next"
import { Suspense } from "react" // Ensure Suspense is imported

import MediaFilters from "@/components/media-filters"
import MediaPagination from "@/components/media-pagination"
import MediaGrid from "@/components/media-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { discoverMovies, discoverTV } from "@/lib/tmdb"

export const metadata: Metadata = {
  title: "Discover | BingeBox",
  description: "Discover movies and TV shows",
}

export const dynamic = "force-dynamic"

interface DiscoverPageProps {
  searchParams: {
    media_type?: string
    page?: string
    sort_by?: string
    with_genres?: string
    year?: string
  }
}

export default function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const mediaType = (searchParams.media_type || "movie") as "movie" | "tv"

  return (
    <main className="container px-4 py-24 mt-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold mb-2 md:mb-0">
          Discover {mediaType === "movie" ? "Movies" : "TV Shows"}
        </h1>
        {/* Links... */}
      </div>

      {/* FIX: Wrap MediaFilters in a Suspense boundary */}
      <Suspense fallback={<Skeleton className="h-10 w-full mb-8" />}>
          <MediaFilters mediaType={mediaType} />
      </Suspense>

      <Suspense fallback={<GridSkeleton />}>
        <DiscoverResults searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function DiscoverResults({ searchParams }: DiscoverPageProps) {
    // ... rest of the component remains the same
    const { media_type = "movie", page = "1" /* etc... */ } = searchParams;
    const data = media_type === "tv" ? await discoverTV(searchParams) : await discoverMovies(searchParams);
    return (
      <>
        {data.results?.length > 0 ? (
          <>
            <MediaGrid items={data.results} />
            <MediaPagination currentPage={Number(page)} totalPages={Math.min(data.total_pages || 1, 500)} totalResults={data.total_results || 0} />
          </>
        ) : (
          <div className="text-center py-12"><p className="text-muted-foreground">No results found.</p></div>
        )}
      </>
    )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array(20).fill(0).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="w-full aspect-[2/3] rounded-lg" />
            <Skeleton className="w-full h-4" />
          </div>
        ))}
    </div>
  )
}

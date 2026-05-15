import TVShowDetailsClient from "@/components/tv-details-client"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchTVDetails } from "@/lib/tmdb"
import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

interface TVPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  const show = await fetchTVDetails(Number.parseInt(params.id))
  if (!show || show.adult || !show.id) return { title: "Not Found | BingeBox" }
  return {
    title: `${show.name || "TV Show"} | BingeBox - Unlimited Streaming`,
    description: show.overview || "Watch this series on BingeBox",
  }
}

export default async function TVShowPage({ params }: TVPageProps) {
  const showId = Number.parseInt(params.id)
  const initialShow = await fetchTVDetails(showId)
  
  // Hard blocker to catch 404s
  if (!initialShow || initialShow.success === false || !initialShow.id) {
    notFound()
  }

  return (
    <main className="min-h-screen pb-16 bg-[#030508]">
      <Suspense fallback={<TVDetailsSkeleton />}>
        <TVShowDetailsClient initialData={initialShow} id={showId} />
      </Suspense>
    </main>
  )
}

function TVDetailsSkeleton() {
  return (
    <div className="w-full h-screen flex flex-col pt-32 px-10 gap-6">
        <Skeleton className="w-[300px] h-[450px] rounded-2xl" />
        <Skeleton className="w-[500px] h-10" />
        <Skeleton className="w-[400px] h-6" />
    </div>
  )
}

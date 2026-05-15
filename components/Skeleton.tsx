import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("nexus-skeleton rounded-2xl", className)} {...props} />;
}

export function MovieCardSkeleton() {
  return <div className="w-[180px] md:w-[260px] aspect-[2/3] nexus-skeleton rounded-[2rem]" />;
}

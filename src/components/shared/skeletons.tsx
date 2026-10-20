import { Skeleton } from "@/components/ui/misc";

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="grid gap-2 p-3.5"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="mt-2 h-6 w-1/3" /><Skeleton className="h-10 w-full" /></div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-4 h-4 w-48" />
      <Skeleton className="mb-8 h-9 w-72" />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-96 lg:block" />
        <GridSkeleton />
      </div>
    </div>
  );
}

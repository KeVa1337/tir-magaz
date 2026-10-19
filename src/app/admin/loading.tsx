import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-96" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-4 h-4 w-64" />
      <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:gap-10">
        <Skeleton className="aspect-[4/3]" />
        <div className="grid content-start gap-4"><Skeleton className="h-6 w-32" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>
      </div>
    </div>
  );
}

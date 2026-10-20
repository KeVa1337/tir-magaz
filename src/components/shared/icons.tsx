import {
  Cog, Disc3, Wind, Waves, Armchair, Settings2, Zap, Link2, CircleDot, Droplet, Package, Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PartArt, hasPartArt } from "./part-art";

const ICONS: Record<string, LucideIcon> = {
  engine: Cog, disc: Disc3, wind: Wind, spring: Waves, cabin: Armchair, gear: Settings2,
  bolt: Zap, link: Link2, axle: CircleDot, droplet: Droplet, kit: Wrench,
};

export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && ICONS[icon]) || Package;
  return <Icon className={cn("size-5", className)} aria-hidden />;
}

/** Плейсхолдер фото товару — нейтральна іконка категорії на технічній сітці. */
export function ProductImage({ src, alt, icon, kind, className }: { src?: string | null; alt: string; icon?: string | null; kind?: string | null; className?: string }) {
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={cn("h-full w-full object-contain", className)} loading="lazy" />;
  if (hasPartArt(kind))
    return (
      <div className={cn("bg-grid flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/80 to-card", className)} role="img" aria-label={alt}>
        <PartArt kind={kind!} className="h-3/4 w-3/4 max-w-96" />
      </div>
    );
  return (
    <div className={cn("bg-grid flex h-full w-full items-center justify-center bg-muted/60", className)} role="img" aria-label={alt}>
      <CategoryIcon icon={icon} className="size-1/3 max-h-16 max-w-16 text-muted-foreground/50" />
    </div>
  );
}

/** Силуети техніки для «технічного паспорта» авто — без логотипів марок. */
export function VehicleSilhouette({ kind, className }: { kind: "TRACTOR" | "TRUCK" | "TRAILER" | "BUS"; className?: string }) {
  if (kind === "TRAILER")
    return (
      <svg viewBox="0 0 220 80" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <rect x="6" y="10" width="190" height="44" rx="3" />
        <path d="M196 46h14v8h-14" />
        <path d="M6 54h190" />
        <circle cx="120" cy="64" r="9" /><circle cx="146" cy="64" r="9" /><circle cx="172" cy="64" r="9" />
        <path d="M30 54v12M24 66h12" />
        <path d="M20 22h60M20 32h40" opacity=".35" />
      </svg>
    );
  return (
    <svg viewBox="0 0 220 80" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M40 58V18a6 6 0 0 1 6-6h40l16 18v28" />
      <path d="M46 20h30v16H46z" opacity=".5" />
      <path d="M102 36h8v22" />
      <path d="M86 12l16 18" opacity=".4" />
      <path d="M110 50h96v8H24v-8h16" />
      <path d="M150 44h40v6h-40z" opacity=".6" />
      <circle cx="58" cy="64" r="10" /><circle cx="160" cy="64" r="10" /><circle cx="184" cy="64" r="10" />
      <path d="M30 40h10" opacity=".5" />
    </svg>
  );
}

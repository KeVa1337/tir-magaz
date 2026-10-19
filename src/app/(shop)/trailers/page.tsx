import Link from "next/link";
import type { Metadata } from "next";
import { getVehicleMakes } from "@/server/services/catalog";
import { getShopContext } from "@/server/context";
import { Breadcrumbs, PageHeader } from "@/components/shared/misc";
import { ProductListing } from "@/components/shop/product-listing";
import { first, parseFilters, type SP } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Запчастини для напівпричепів — осі BPW, SAF, ROR",
  description: "Гальмівні колодки, диски, барабани, підшипники ступиць і пневмоподушки для осей BPW, SAF, ROR. Schmitz Cargobull, Krone, Kögel.",
};

const AXLES = [
  { id: "BPW", text: "ECO Plus, TS2, Airlight II" },
  { id: "SAF", text: "Intradisc plus, SBS" },
  { id: "ROR", text: "Meritor, барабанні гальма" },
];

export default async function TrailersPage({ searchParams }: PageProps<"/trailers">) {
  const sp = (await searchParams) as SP;
  const axle = AXLES.find((a) => a.id === first(sp.axle)?.toUpperCase())?.id;
  const { ctx } = await getShopContext();
  const makes = await getVehicleMakes("TRAILER");
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Головна", href: "/" }, { label: "Напівпричепи" }]} />
      <PageHeader title="Запчастини для напівпричепів" description="Деталь залежить від марки осей, а не від марки причепа — оберіть осі або додайте причіп у гараж" />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Link href="/trailers" className={cn("rounded-xl border p-4", !axle ? "border-primary bg-primary/10" : "bg-card hover:bg-accent")}>
          <span className="block text-lg font-black">Усі осі</span><span className="text-xs text-muted-foreground">BPW · SAF · ROR</span>
        </Link>
        {AXLES.map((a) => (
          <Link key={a.id} href={`/trailers?axle=${a.id}`} className={cn("bg-grid rounded-xl border p-4", axle === a.id ? "border-primary bg-primary/10" : "bg-card hover:bg-accent")}>
            <span className="block font-num text-lg font-black">{a.id}</span><span className="text-xs text-muted-foreground">{a.text}</span>
          </Link>
        ))}
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Марки причепів у довіднику: {makes.map((m) => `${m.name} (${m.series.map((s) => s.name).join(", ")})`).join("; ")}</p>
      <ProductListing key={axle ?? "all"} base={{ trailerOnly: true, axleBrand: axle }} filters={parseFilters(sp)} sp={sp} ctx={ctx} basePath="/trailers" />
    </div>
  );
}

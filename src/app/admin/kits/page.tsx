import Link from "next/link";
import { Plus } from "lucide-react";
import { adminListKits } from "@/server/services/admin/catalog";
import { PageHeader } from "@/components/shared/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, toNumber } from "@/lib/format";

export const metadata = { title: "Комплекти ТО" };

export default async function KitsAdminPage() {
  const kits = await adminListKits();
  return (
    <div className="grid gap-4">
      <PageHeader title="Комплекти ТО" className="mb-0"><Button asChild><Link href="/admin/kits/new"><Plus /> Новий комплект</Link></Button></PageHeader>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {kits.map((k) => (
          <Link key={k.id} href={`/admin/kits/${k.id}`} className="rounded-xl border bg-card p-4 hover:border-primary/50">
            <div className="flex items-start justify-between gap-2"><p className="font-bold">{k.name}</p>{!k.isActive && <Badge tone="red">прихований</Badge>}</div>
            <p className="text-sm text-muted-foreground">{[k.make?.name, k.series?.name, k.engineCode?.code].filter(Boolean).join(" · ") || "Без прив'язки"}</p>
            <p className="mt-2 text-sm">{k.items.length} позицій · <b className="tabular-nums">{formatPrice(k.items.reduce((s, i) => s + toNumber(i.product.price) * i.qty, 0))}</b></p>
          </Link>
        ))}
      </div>
    </div>
  );
}

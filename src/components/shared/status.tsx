import { CircleCheck, CircleHelp, CircleX } from "lucide-react";
import type { OrderStatus, StockStatus, VinRequestStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS, STOCK_STATUS, VIN_STATUS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function VinStatusBadge({ status }: { status: VinRequestStatus }) {
  const s = VIN_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function StockBadge({ status, qty, leadTimeDays, className }: { status: StockStatus; qty?: number; leadTimeDays?: number | null; className?: string }) {
  const s = STOCK_STATUS[status];
  const dot = { green: "bg-success", amber: "bg-warning", red: "bg-danger", blue: "bg-info", neutral: "bg-muted-foreground" }[s.tone];
  let label: string = s.label;
  if (status === "LOW" && qty) label = `Залишилось ${qty} шт.`;
  if (status === "ON_ORDER" && leadTimeDays) label = `Під замовлення, ${leadTimeDays} дн.`;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", className)}>
      <span className={cn("size-2 rounded-full", dot)} />
      {label}
    </span>
  );
}

export type FitStatusValue = "fits" | "maybe" | "no";

/** Бейдж сумісності ✔ / ? / ✖ (SPEC §7.2). */
export function FitBadge({ status, label, className, title }: { status: FitStatusValue; label?: string; className?: string; title?: string }) {
  const map = {
    fits: { tone: "green" as const, Icon: CircleCheck, text: "Підходить" },
    maybe: { tone: "amber" as const, Icon: CircleHelp, text: "Уточнити" },
    no: { tone: "red" as const, Icon: CircleX, text: "Не підходить" },
  }[status];
  return (
    <Badge tone={map.tone} className={className} title={title}>
      <map.Icon />
      {label ?? map.text}
    </Badge>
  );
}

import type { OrderStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { ORDER_STATUS } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const FLOW: OrderStatus[] = ["NEW", "CONFIRMED", "PAID", "PACKED", "SHIPPED", "DELIVERED"];

/** Прогрес замовлення + історія змін статусу. */
export function OrderTimeline({ status, history }: { status: OrderStatus; history: { id: string; status: OrderStatus; comment: string | null; createdAt: Date; byUser?: { name: string | null; role: string } | null }[] }) {
  const idx = FLOW.indexOf(status === "AWAITING_PAYMENT" ? "CONFIRMED" : status);
  const cancelled = status === "CANCELLED" || status === "RETURNED";
  return (
    <div className="grid gap-5">
      {!cancelled && (
        <ol className="grid grid-cols-6 gap-1">
          {FLOW.map((s, i) => (
            <li key={s} className="grid gap-1.5">
              <span className={cn("h-1.5 rounded-full", i <= idx ? "bg-primary" : "bg-muted")} />
              <span className={cn("hidden text-[11px] font-semibold sm:block", i <= idx ? "text-foreground" : "text-muted-foreground")}>{ORDER_STATUS[s].label}</span>
            </li>
          ))}
        </ol>
      )}
      <ul className="grid gap-3">
        {[...history].reverse().map((h) => (
          <li key={h.id} className="flex gap-3 text-sm">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="size-3" /></span>
            <span>
              <b>{ORDER_STATUS[h.status].label}</b> <span className="text-muted-foreground">· {formatDateTime(h.createdAt)}{h.byUser?.name && h.byUser.role !== "CUSTOMER" ? ` · ${h.byUser.name}` : ""}</span>
              {h.comment && <span className="block text-muted-foreground">{h.comment}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

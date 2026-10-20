"use client";

import * as React from "react";
import Link from "next/link";
import { Car, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { removeCartItemAction, updateCartQtyAction } from "@/server/actions/shop";
import type { CartView } from "@/server/services/cart";
import { ProductImage } from "@/components/shared/icons";
import { StockBadge } from "@/components/shared/status";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CartItems({ items }: { items: CartView["items"] }) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {items.map((i) => <CartRow key={i.id} item={i} />)}
    </ul>
  );
}

function CartRow({ item }: { item: CartView["items"][number] }) {
  const [pending, start] = React.useTransition();
  const setQty = (q: number) => start(() => updateCartQtyAction(item.id, q));
  return (
    <li className={cn("flex gap-3 p-3 sm:gap-4 sm:p-4", pending && "opacity-60")}>
      <Link href={`/product/${item.product.slug}`} className="size-20 shrink-0 overflow-hidden rounded-lg border sm:size-24">
        <ProductImage src={item.product.image} alt={item.product.name} icon={item.product.icon} kind={item.product.kind} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Link href={`/product/${item.product.slug}`} className="line-clamp-2 text-sm font-semibold hover:underline">{item.product.name}</Link>
        <p className="text-xs text-muted-foreground"><span className="font-num text-foreground/80">{item.product.article}</span> · {item.product.brand}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <StockBadge status={item.product.stockStatus} qty={item.product.stockQty} leadTimeDays={item.product.leadTimeDays} />
          <span className="text-xs text-muted-foreground">{item.source.warehouse}{item.source.leadDays ? ` · ${item.source.leadDays} дн.` : ""}</span>
          {item.vehicle && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Car className="size-3.5" /> {item.vehicle.nickname ?? "авто з гаража"}</span>}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex h-10 items-center rounded-lg border">
            <button className="flex h-full w-10 cursor-pointer items-center justify-center hover:bg-accent" onClick={() => setQty(item.qty - 1)} disabled={pending} aria-label="Менше"><Minus className="size-4" /></button>
            <span className="w-10 text-center font-num font-bold">{pending ? <Loader2 className="mx-auto size-4 animate-spin" /> : item.qty}</span>
            <button className="flex h-full w-10 cursor-pointer items-center justify-center hover:bg-accent" onClick={() => setQty(item.qty + 1)} disabled={pending} aria-label="Більше"><Plus className="size-4" /></button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-extrabold tabular-nums">{formatPrice(item.lineTotal)}</p>
              {item.qty > 1 && <p className="text-xs text-muted-foreground tabular-nums">{formatPrice(item.product.price)} / шт.</p>}
            </div>
            <button onClick={() => start(() => removeCartItemAction(item.id))} disabled={pending} className="flex size-10 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-danger/10 hover:text-danger" aria-label="Видалити">
              <Trash2 className="size-4.5" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

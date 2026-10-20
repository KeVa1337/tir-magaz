"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addKitToCartAction, addToCartAction } from "@/server/actions/shop";
import { cn } from "@/lib/utils";

export function AddToCartButton({ productId, disabled, size = "default", withQty, className, label = "В кошик" }: {
  productId: string; disabled?: boolean; size?: "default" | "sm" | "lg" | "xl"; withQty?: boolean; className?: string; label?: string;
}) {
  const router = useRouter();
  const [qty, setQty] = React.useState(1);
  const [pending, start] = React.useTransition();
  const [added, setAdded] = React.useState(false);

  const add = () =>
    start(async () => {
      const res = await addToCartAction(productId, qty);
      if (!res.ok) return void toast.error(res.error ?? "Не вдалося додати");
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
      toast.success("Додано в кошик", { action: { label: "Відкрити кошик", onClick: () => router.push("/cart") } });
    });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {withQty && (
        <div className="flex h-12 items-center rounded-lg border bg-card">
          <button type="button" className="flex h-full w-11 cursor-pointer items-center justify-center hover:bg-accent disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Менше"><Minus className="size-4" /></button>
          <input aria-label="Кількість" inputMode="numeric" className="h-full w-12 bg-transparent text-center font-num font-bold outline-none" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value.replace(/\D/g, "")) || 1)))} />
          <button type="button" className="flex h-full w-11 cursor-pointer items-center justify-center hover:bg-accent" onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Більше"><Plus className="size-4" /></button>
        </div>
      )}
      <Button size={size} onClick={add} disabled={disabled || pending} className={cn(withQty && "flex-1")}>
        {pending ? <Loader2 className="animate-spin" /> : added ? <Check /> : <ShoppingCart />}
        {label}
      </Button>
    </div>
  );
}

export function AddKitButton({ kitId, className }: { kitId: string; className?: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await addKitToCartAction(kitId);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Комплект додано в кошик", { action: { label: "Відкрити кошик", onClick: () => router.push("/cart") } });
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <ShoppingCart />} Додати комплект у кошик
    </Button>
  );
}

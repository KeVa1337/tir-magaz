"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Paperclip, Send, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { addVinItemsToCartAction, vinMessageAction } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Checkbox, Textarea } from "@/components/ui/input";
import { StockBadge } from "@/components/shared/status";
import { PartNumber } from "@/components/shared/part-number";
import { formatPrice } from "@/lib/format";
import type { ActionState } from "@/lib/validators";
import type { StockStatus } from "@prisma/client";

export interface ProposedItem {
  id: string; qty: number; comment: string | null;
  product: { slug: string; name: string; article: string; brand: string; price: number; stockStatus: StockStatus; leadTimeDays: number | null; isActive: boolean };
}

/** Відповідь менеджера: список деталей з вибором і «Додати все в кошик». */
export function ProposedItems({ requestId, items }: { requestId: string; items: ProposedItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>(items.filter((i) => i.product.isActive).map((i) => i.id));
  const [pending, start] = React.useTransition();
  const total = items.filter((i) => selected.includes(i.id)).reduce((s, i) => s + i.product.price * i.qty, 0);

  const add = (ids?: string[]) =>
    start(async () => {
      const res = await addVinItemsToCartAction(requestId, ids);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Додано в кошик: ${res.added} поз.`, { action: { label: "Кошик", onClick: () => router.push("/cart") } });
    });

  return (
    <div className="rounded-xl border border-success/40 bg-card">
      <div className="border-b bg-success/10 px-4 py-3">
        <p className="font-extrabold">Підібрані деталі</p>
        <p className="text-sm text-muted-foreground">Позначте потрібні або додайте все одним кліком</p>
      </div>
      <ul className="divide-y">
        {items.map((i) => (
          <li key={i.id} className="flex gap-3 p-4">
            <Checkbox className="mt-1" checked={selected.includes(i.id)} disabled={!i.product.isActive} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, i.id] : s.filter((x) => x !== i.id)))} aria-label={`Обрати ${i.product.name}`} />
            <div className="min-w-0 flex-1">
              <Link href={`/product/${i.product.slug}`} className="font-semibold hover:underline">{i.product.name}</Link>
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                <PartNumber value={i.product.article} size="xs" /> <span>{i.product.brand}</span>
                <StockBadge status={i.product.stockStatus} leadTimeDays={i.product.leadTimeDays} />
              </div>
              {i.comment && <p className="mt-1 text-sm text-info">💬 {i.comment}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-bold tabular-nums">{formatPrice(i.product.price * i.qty)}</p>
              <p className="text-xs text-muted-foreground">{i.qty} шт.</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
        <p>Обрано на <b className="tabular-nums">{formatPrice(total)}</b></p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending || !selected.length} onClick={() => add(selected)}>Додати вибрані</Button>
          <Button disabled={pending} onClick={() => add()}>{pending ? <Loader2 className="animate-spin" /> : <ShoppingCart />} Додати все в кошик</Button>
        </div>
      </div>
    </div>
  );
}

export function MessageForm({ requestId }: { requestId: string }) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [files, setFiles] = React.useState(0);
  const [state, action] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await vinMessageAction(prev, fd);
    if (res.ok) {
      formRef.current?.reset();
      setFiles(0);
    }
    return res;
  }, {});
  return (
    <form ref={formRef} action={action} className="grid gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <Textarea name="text" rows={3} placeholder="Уточнення або питання менеджеру…" aria-label="Повідомлення" aria-invalid={!!state.fieldErrors?.text} />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Paperclip className="size-4" /> {files ? `Файлів: ${files}` : "Фото"}
          <input type="file" name="files" accept="image/*,application/pdf" multiple className="sr-only" onChange={(e) => setFiles(e.target.files?.length ?? 0)} />
        </label>
        <SendButton />
      </div>
    </form>
  );
}

function SendButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Send />} Надіслати</Button>;
}

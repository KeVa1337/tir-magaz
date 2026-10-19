"use client";

import * as React from "react";
import { useActionState } from "react";
import { Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { VinRequestStatus } from "@prisma/client";
import { vinAddItemAction, vinAnswerAction, vinAssignAction, vinLinkOeAction, vinMessageAdminAction, vinRemoveItemAction, vinSetStatusAction, vinUnlinkOeAction } from "@/server/actions/admin";
import { ProductPicker } from "./widgets";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import { PartNumber } from "@/components/shared/part-number";
import { StockBadge } from "@/components/shared/status";
import { formatPrice } from "@/lib/format";
import type { ActionState } from "@/lib/validators";
import type { StockStatus } from "@prisma/client";

export interface WorkItem {
  id: string; qty: number; comment: string | null;
  product: { id: string; name: string; article: string; articleNorm: string; brand: string; price: number; stockStatus: StockStatus; isOriginal: boolean; oe: { number: string; norm: string; brand: string | null }[] };
}

export function ProposalEditor({ requestId, items, vehicleId, linked }: { requestId: string; items: WorkItem[]; vehicleId: string | null; linked: string[] }) {
  const [pending, start] = React.useTransition();
  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  return (
    <div className="grid gap-4">
      <ProductPicker placeholder="Знайдіть деталь і додайте у відповідь…" onPick={(p) => start(async () => { const r = await vinAddItemAction(requestId, p.id, 1); if (!r.ok) toast.error(r.error); })} />
      {items.length ? (
        <ul className="divide-y rounded-lg border">
          {items.map((i) => <ProposalRow key={`${i.id}-${i.qty}-${i.comment}`} requestId={requestId} item={i} vehicleId={vehicleId} linked={linked} />)}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Додайте товари — клієнт побачить їх списком з кнопкою «Додати все в кошик».</p>}
      {items.length > 0 && <p className="text-right text-sm">Разом у пропозиції: <b className="tabular-nums">{formatPrice(total)}</b></p>}
      {pending && <Loader2 className="size-4 animate-spin" />}
    </div>
  );
}

function ProposalRow({ requestId, item, vehicleId, linked }: { requestId: string; item: WorkItem; vehicleId: string | null; linked: string[] }) {
  const [qty, setQty] = React.useState(String(item.qty));
  const [comment, setComment] = React.useState(item.comment ?? "");
  const [pending, start] = React.useTransition();
  const dirty = Number(qty) !== item.qty || comment !== (item.comment ?? "");
  const numbers = item.product.isOriginal ? [{ number: item.product.article, norm: item.product.articleNorm, brand: item.product.brand }, ...item.product.oe] : item.product.oe;
  return (
    <li className="grid gap-2 p-3">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{item.product.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground"><span className="font-num">{item.product.article}</span> · {item.product.brand} <StockBadge status={item.product.stockStatus} /></span>
        </span>
        <span className="shrink-0 text-sm font-bold tabular-nums">{formatPrice(item.product.price * Number(qty || 0))}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Input aria-label="Кількість" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className="h-8 w-14 text-center font-num" />
        <Input aria-label="Коментар для клієнта" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Коментар для клієнта" className="h-8 min-w-40 flex-1" />
        <Button size="sm" variant={dirty ? "default" : "ghost"} disabled={!dirty || pending} onClick={() => start(async () => { await vinAddItemAction(requestId, item.product.id, Math.max(1, Number(qty)), comment); })}>Зберегти</Button>
        <Button size="icon-sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => start(async () => { await vinRemoveItemAction(requestId, item.id); })} aria-label="Прибрати"><Trash2 /></Button>
      </div>
      {vehicleId && numbers.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Прив&apos;язати OE до авто:</span>
          {numbers.map((n) => {
            const done = linked.includes(n.norm);
            return (
              <button key={n.norm} disabled={done || pending} onClick={() => start(async () => { const r = await vinLinkOeAction(vehicleId, n.number, item.product.name.split(" ").slice(0, 3).join(" ")); if (r.ok) toast.success(`OE ${n.number} збережено за авто`); else toast.error(r.error); })}
                className={done ? "rounded border border-success/40 bg-success/10 px-2 py-0.5 font-num text-success" : "cursor-pointer rounded border px-2 py-0.5 font-num hover:border-primary"}>
                {done ? "✔ " : <Link2 className="mr-1 inline size-3" />}{n.number}{n.brand ? ` (${n.brand})` : ""}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

export function OeLinker({ vehicleId, items }: { vehicleId: string; items: { id: string; oeNumber: string; label: string | null }[] }) {
  const [num, setNum] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <div className="grid gap-3">
      <ul className="grid gap-1.5">
        {items.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm">
            <span className="min-w-0"><PartNumber value={o.oeNumber} size="xs" /> <span className="text-xs text-muted-foreground">{o.label}</span></span>
            <Button size="icon-sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => start(async () => { await vinUnlinkOeAction(o.id); })} aria-label="Відв'язати"><Trash2 /></Button>
          </li>
        ))}
        {!items.length && <li className="text-xs text-muted-foreground">Поки немає прив&apos;язаних номерів</li>}
      </ul>
      <form className="grid gap-1.5" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await vinLinkOeAction(vehicleId, num, label); if (r.ok) { setNum(""); setLabel(""); toast.success("OE-номер збережено"); } else toast.error(r.error); }); }}>
        <Input value={num} onChange={(e) => setNum(e.target.value)} placeholder="OE-номер з каталогу виробника" className="h-8 font-num" aria-label="OE-номер" />
        <div className="flex gap-1.5">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Що це (напр. Фільтр паливний)" className="h-8" aria-label="Опис" />
          <Button size="sm" disabled={!num.trim() || pending}><Plus /> Додати</Button>
        </div>
      </form>
    </div>
  );
}

export function AnswerForms({ requestId, status, hasItems, assigned }: { requestId: string; status: VinRequestStatus; hasItems: boolean; assigned: boolean }) {
  const [ans, answerAction] = useActionState<ActionState, FormData>(vinAnswerAction, {});
  const [msg, messageAction] = useActionState<ActionState, FormData>(vinMessageAdminAction, {});
  const [pending, start] = React.useTransition();
  const ansRef = React.useRef<HTMLFormElement>(null);
  const msgRef = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => { if (ans.ok) ansRef.current?.reset(); }, [ans]);
  React.useEffect(() => { if (msg.ok) msgRef.current?.reset(); }, [msg]);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {!assigned && <Button variant="secondary" size="sm" disabled={pending} onClick={() => start(async () => { await vinAssignAction(requestId); toast.success("Запит взято в роботу"); })}>Взяти в роботу</Button>}
        {status !== "CLOSED" && <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => { await vinSetStatusAction(requestId, "CLOSED"); })}>Закрити запит</Button>}
        {status === "CLOSED" && <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => { await vinSetStatusAction(requestId, "IN_PROGRESS"); })}>Відкрити знову</Button>}
      </div>
      <form ref={ansRef} action={answerAction} className="grid gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
        <input type="hidden" name="id" value={requestId} />
        <p className="text-sm font-bold">Відповідь клієнту</p>
        <Textarea name="text" rows={3} placeholder="Підібрали за вашим VIN: …" aria-label="Текст відповіді" />
        {!hasItems && <p className="text-xs text-warning">У відповіді ще немає товарів — додайте їх вище.</p>}
        <FormMessage state={ans} />
        <SubmitButton pendingText="Надсилаємо…">Надіслати відповідь (статус «Є відповідь»)</SubmitButton>
      </form>
      <form ref={msgRef} action={messageAction} className="grid gap-2">
        <input type="hidden" name="id" value={requestId} />
        <Textarea name="text" rows={2} placeholder="Уточнююче питання клієнту (без зміни статусу)" aria-label="Повідомлення" />
        <FormMessage state={msg} />
        <SubmitButton variant="outline" size="sm" className="justify-self-start">Надіслати повідомлення</SubmitButton>
      </form>
    </div>
  );
}

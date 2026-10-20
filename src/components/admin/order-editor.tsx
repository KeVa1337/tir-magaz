"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";
import { addOrderItemAction, setOrderStatusAction, updateOrderItemAction, updateOrderMetaAction } from "@/server/actions/admin";
import { ProductPicker } from "./widgets";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { ORDER_STATUS } from "@/lib/labels";
import { formatPrice } from "@/lib/format";
import type { ActionState } from "@/lib/validators";

export function StatusChanger({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [value, setValue] = React.useState(status);
  const [comment, setComment] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <div className="grid gap-2">
      <NativeSelect value={value} onChange={(e) => setValue(e.target.value as OrderStatus)} aria-label="Статус">
        {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
      </NativeSelect>
      <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Коментар (ТТН, причина…) — побачить клієнт" aria-label="Коментар до статусу" />
      <Button disabled={pending || (value === status && !comment)} onClick={() => start(async () => {
        const r = await setOrderStatusAction(orderId, value, comment);
        if (r.ok) { toast.success(`Статус: ${ORDER_STATUS[value].label}`); setComment(""); } else toast.error(r.error);
      })}>{pending && <Loader2 className="animate-spin" />} Змінити статус</Button>
      <div className="flex flex-wrap gap-1">
        {status === "NEW" && <Button size="sm" variant="success" disabled={pending} onClick={() => start(async () => { await setOrderStatusAction(orderId, "CONFIRMED", "Наявність підтверджено"); toast.success("Підтверджено"); })}><Check /> Підтвердити</Button>}
      </div>
    </div>
  );
}

interface Item { id: string; name: string; article: string; brandName: string | null; price: number; qty: number; warehouse?: string | null; leadDays?: number | null }

export function OrderItemsEditor({ orderId, items, editable }: { orderId: string; items: Item[]; editable: boolean }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div>
      <ul className="divide-y border-t">
        {items.map((i) => <ItemRow key={`${i.id}-${i.qty}-${i.price}`} orderId={orderId} item={i} editable={editable} />)}
      </ul>
      <div className="flex justify-between border-t px-5 py-3 font-extrabold"><span>Разом</span><span className="tabular-nums">{formatPrice(total)}</span></div>
      {editable && (
        <div className="border-t p-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Додати позицію</p>
          <ProductPicker onPick={async (p) => { const r = await addOrderItemAction(orderId, p.id, 1); if (r.ok) toast.success("Позицію додано"); else toast.error(r.error); }} />
        </div>
      )}
    </div>
  );
}

function ItemRow({ orderId, item, editable }: { orderId: string; item: Item; editable: boolean }) {
  const [qty, setQty] = React.useState(String(item.qty));
  const [price, setPrice] = React.useState(String(item.price));
  const [pending, start] = React.useTransition();
  const dirty = Number(qty) !== item.qty || Number(price) !== item.price;
  const save = (q = Number(qty)) => start(async () => { const r = await updateOrderItemAction(orderId, item.id, q, Number(price)); if (!r.ok) toast.error(r.error); });
  return (
    <li className="grid gap-2 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <span className="min-w-0"><span className="block text-sm font-semibold">{item.name}</span><span className="font-num text-xs text-muted-foreground">{item.article} · {item.brandName}</span>{item.warehouse && <span className="block text-xs text-info">{item.warehouse}{item.leadDays ? ` · ${item.leadDays} дн.` : ""}</span>}</span>
      {editable ? (
        <span className="flex items-center gap-1.5">
          <Input aria-label="Ціна" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} className="h-8 w-24 text-right font-num" />
          <span className="text-muted-foreground">×</span>
          <Input aria-label="Кількість" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className="h-8 w-14 text-center font-num" />
          <span className="w-24 text-right text-sm font-bold tabular-nums">{formatPrice(Number(price) * Number(qty))}</span>
          <Button size="icon-sm" variant={dirty ? "default" : "ghost"} disabled={!dirty || pending} onClick={() => save()} aria-label="Зберегти">{pending ? <Loader2 className="animate-spin" /> : <Check />}</Button>
          <Button size="icon-sm" variant="ghost" disabled={pending} onClick={() => save(0)} aria-label="Видалити позицію" className="text-danger"><Trash2 /></Button>
        </span>
      ) : (
        <span className="text-sm tabular-nums">{formatPrice(item.price)} × {item.qty} = <b>{formatPrice(item.price * item.qty)}</b></span>
      )}
    </li>
  );
}

export function OrderMetaForm({ order }: { order: { id: string; managerComment: string | null; contactName: string; contactPhone: string; deliveryCity: string | null; deliveryBranch: string | null } }) {
  const [state, action] = useActionState<ActionState, FormData>(updateOrderMetaAction, {});
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={order.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ім'я"><Input name="contactName" defaultValue={order.contactName} /></Field>
        <Field label="Телефон"><Input name="contactPhone" defaultValue={order.contactPhone} /></Field>
        <Field label="Місто"><Input name="deliveryCity" defaultValue={order.deliveryCity ?? ""} /></Field>
        <Field label="Відділення"><Input name="deliveryBranch" defaultValue={order.deliveryBranch ?? ""} /></Field>
      </div>
      <Field label="Внутрішній коментар менеджера" hint="Клієнт не бачить"><Textarea name="managerComment" rows={3} defaultValue={order.managerComment ?? ""} /></Field>
      <FormMessage state={state} />
      <SubmitButton variant="secondary" className="justify-self-start">Зберегти</SubmitButton>
    </form>
  );
}

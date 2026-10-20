"use client";

import * as React from "react";
import { useActionState } from "react";
import { Building2, CreditCard, Package, Store, Truck, Wallet } from "lucide-react";
import { checkoutAction } from "@/server/actions/shop";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/lib/validators";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const DELIVERY = [
  { id: "pickup", label: "Самовивіз", hint: "зі складу, сьогодні", icon: Store },
  { id: "novaposhta", label: "Нова Пошта", hint: "у відділення", icon: Package },
  { id: "novaposhta_courier", label: "Кур'єр НП", hint: "на адресу", icon: Truck },
] as const;
const PAYMENT = [
  { id: "cash", label: "При отриманні", hint: "готівка / накладений платіж", icon: Wallet },
  { id: "card", label: "Карткою онлайн", hint: "у демо оплата не списується", icon: CreditCard },
  { id: "invoice", label: "Рахунок", hint: "для юросіб і ФОП", icon: Building2 },
] as const;

export function CheckoutForm({ total, defaults, vehicles, allowedDelivery, allowedPayment, pickupAddress }: {
  total: number;
  defaults: { name?: string; phone?: string; email?: string; city?: string; branch?: string; vehicleId?: string; mileage?: number };
  vehicles: { id: string; label: string; mileageKm: number | null }[];
  allowedDelivery: string[];
  allowedPayment: string[];
  pickupAddress: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(checkoutAction, {});
  const [delivery, setDelivery] = React.useState<string>(allowedDelivery.includes("novaposhta") ? "novaposhta" : allowedDelivery[0]);
  const [payment, setPayment] = React.useState<string>(allowedPayment[0]);
  const [vehicleId, setVehicleId] = React.useState(defaults.vehicleId ?? "");
  const fe = state.fieldErrors ?? {};
  const veh = vehicles.find((v) => v.id === vehicleId);

  return (
    <form action={action} className="grid gap-6" noValidate>
      <section className="grid gap-4 rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">1</span> Контакти</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ім'я та прізвище" htmlFor="contactName" error={fe.contactName} required>
            <Input id="contactName" name="contactName" defaultValue={defaults.name} autoComplete="name" />
          </Field>
          <Field label="Телефон" htmlFor="contactPhone" error={fe.contactPhone} required>
            <Input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" defaultValue={defaults.phone} autoComplete="tel" placeholder="+380…" />
          </Field>
          <Field label="Email" htmlFor="contactEmail" error={fe.contactEmail} hint="Надішлемо підтвердження" className="sm:col-span-2">
            <Input id="contactEmail" name="contactEmail" type="email" inputMode="email" defaultValue={defaults.email} autoComplete="email" />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">2</span> Доставка</h2>
        <input type="hidden" name="deliveryMethod" value={delivery} />
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Спосіб доставки">
          {DELIVERY.filter((d) => allowedDelivery.includes(d.id)).map((d) => (
            <button type="button" role="radio" aria-checked={delivery === d.id} key={d.id} onClick={() => setDelivery(d.id)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left", delivery === d.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-accent")}>
              <d.icon className="size-5 shrink-0 text-primary" />
              <span><span className="block text-sm font-bold">{d.label}</span><span className="text-xs text-muted-foreground">{d.hint}</span></span>
            </button>
          ))}
        </div>
        {delivery === "pickup" ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">Адреса складу: <b>{pickupAddress}</b></p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Місто" htmlFor="deliveryCity" error={fe.deliveryCity} required>
              <Input id="deliveryCity" name="deliveryCity" defaultValue={defaults.city} placeholder="Наприклад, Житомир" />
            </Field>
            {delivery === "novaposhta" ? (
              <Field label="Відділення" htmlFor="deliveryBranch" error={fe.deliveryBranch} required hint="Демо: без інтеграції з API Нової Пошти">
                <Input id="deliveryBranch" name="deliveryBranch" defaultValue={defaults.branch} placeholder="Відділення №12" />
              </Field>
            ) : (
              <Field label="Адреса" htmlFor="deliveryAddress" error={fe.deliveryAddress} required>
                <Input id="deliveryAddress" name="deliveryAddress" placeholder="Вулиця, будинок" />
              </Field>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">3</span> Оплата</h2>
        <input type="hidden" name="paymentMethod" value={payment} />
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Спосіб оплати">
          {PAYMENT.filter((p) => allowedPayment.includes(p.id)).map((p) => (
            <button type="button" role="radio" aria-checked={payment === p.id} key={p.id} onClick={() => setPayment(p.id)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-left", payment === p.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-accent")}>
              <p.icon className="size-5 shrink-0 text-primary" />
              <span><span className="block text-sm font-bold">{p.label}</span><span className="text-xs text-muted-foreground">{p.hint}</span></span>
            </button>
          ))}
        </div>
      </section>

      {vehicles.length > 0 && (
        <section className="grid gap-4 rounded-xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">4</span> Для якого авто? <span className="text-sm font-normal text-muted-foreground">(необов&apos;язково)</span></h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Авто з гаража" htmlFor="vehicleId" hint="Замовлення з'явиться в історії цього авто">
              <NativeSelect id="vehicleId" name="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">Не прив&apos;язувати</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </NativeSelect>
            </Field>
            {vehicleId && (
              <Field label="Поточний пробіг, км" htmlFor="mileageKm" error={fe.mileageKm}>
                <Input id="mileageKm" name="mileageKm" inputMode="numeric" defaultValue={veh?.mileageKm ?? ""} key={vehicleId} />
              </Field>
            )}
          </div>
        </section>
      )}

      <Field label="Коментар до замовлення" htmlFor="comment">
        <Textarea id="comment" name="comment" rows={3} placeholder="Наприклад: зателефонуйте перед відправкою" />
      </Field>

      <FormMessage state={state} />
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
        <div>
          <p className="text-sm text-muted-foreground">До сплати</p>
          <p className="text-2xl font-extrabold tabular-nums">{formatPrice(total)}</p>
        </div>
        <SubmitButton size="xl" pendingText="Оформлюємо…">Підтвердити замовлення</SubmitButton>
      </div>
      <p className="text-xs text-muted-foreground">Демо-версія: оплата не проводиться, замовлення отримує статус «Нове» і чекає підтвердження менеджера.</p>
    </form>
  );
}

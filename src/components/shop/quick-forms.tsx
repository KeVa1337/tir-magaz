"use client";

import * as React from "react";
import { useActionState } from "react";
import { PhoneCall, Zap } from "lucide-react";
import { callbackAction, quickOrderAction } from "@/server/actions/shop";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import type { ActionState } from "@/lib/validators";
import { formatPrice } from "@/lib/format";

export function QuickOrderButton({ productId, name, price, disabled }: { productId: string; name: string; price: number; disabled?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(quickOrderAction, {});
  const [qty, setQty] = React.useState(1);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" disabled={disabled} className="w-full"><Zap /> Купити в 1 клік</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Купити в 1 клік</DialogTitle>
        <DialogDescription>Залиште телефон — менеджер передзвонить і уточнить доставку та оплату. Без реєстрації і довгих форм.</DialogDescription>
        {state.ok ? (
          <FormMessage state={state} />
        ) : (
          <form action={action} className="grid gap-3">
            <input type="hidden" name="productId" value={productId} />
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold">{name}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2">К-сть <Input name="qty" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} className="h-8 w-16 text-center font-num" inputMode="numeric" /></label>
                <b className="tabular-nums">{formatPrice(price * qty)}</b>
              </div>
            </div>
            <Field label="Телефон" htmlFor="qo-phone" error={state.fieldErrors?.phone} required>
              <Input id="qo-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 67 123 45 67" autoFocus />
            </Field>
            <Field label="Ім'я" htmlFor="qo-name"><Input id="qo-name" name="name" autoComplete="name" /></Field>
            <FormMessage state={state} />
            <SubmitButton size="lg">Замовити</SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CallbackDialog({ trigger, productId }: { trigger: React.ReactNode; productId?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(callbackAction, {});
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2"><PhoneCall className="size-5 text-primary" /> Передзвоніть мені</DialogTitle>
        <DialogDescription>Підберемо деталь по телефону — у робочий час передзвонюємо протягом 15 хвилин.</DialogDescription>
        {state.ok ? (
          <FormMessage state={state} />
        ) : (
          <form action={action} className="grid gap-3">
            {productId && <input type="hidden" name="productId" value={productId} />}
            <Field label="Телефон" htmlFor="cb-phone" error={state.fieldErrors?.phone} required>
              <Input id="cb-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 67 123 45 67" autoFocus />
            </Field>
            <Field label="Ім'я" htmlFor="cb-name"><Input id="cb-name" name="name" autoComplete="name" /></Field>
            <Field label="Що потрібно (необов'язково)" htmlFor="cb-comment"><Input id="cb-comment" name="comment" placeholder="Напр.: колодки на MAN TGX 2014" /></Field>
            <FormMessage state={state} />
            <SubmitButton size="lg">Чекаю дзвінка</SubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

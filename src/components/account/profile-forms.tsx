"use client";

import * as React from "react";
import { useActionState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import { changePasswordAction, deleteAddressAction, saveAddressAction, updateProfileAction } from "@/server/actions/account";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Checkbox, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActionState } from "@/lib/validators";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="Email" hint="Використовується для входу"><Input value={email} disabled /></Field>
      <Field label="Ім'я та прізвище" htmlFor="name" error={state.fieldErrors?.name}><Input id="name" name="name" defaultValue={name} /></Field>
      <Field label="Телефон" htmlFor="phone" error={state.fieldErrors?.phone}><Input id="phone" name="phone" type="tel" defaultValue={phone} /></Field>
      <FormMessage state={state} />
      <SubmitButton className="justify-self-start">Зберегти</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="grid gap-4">
      <Field label="Поточний пароль" htmlFor="current" error={state.fieldErrors?.current}><Input id="current" name="current" type="password" autoComplete="current-password" /></Field>
      <Field label="Новий пароль" htmlFor="next" error={state.fieldErrors?.next}><Input id="next" name="next" type="password" autoComplete="new-password" /></Field>
      <Field label="Повторіть пароль" htmlFor="confirm" error={state.fieldErrors?.confirm}><Input id="confirm" name="confirm" type="password" autoComplete="new-password" /></Field>
      <FormMessage state={state} />
      <SubmitButton variant="secondary" className="justify-self-start">Змінити пароль</SubmitButton>
    </form>
  );
}

export function Addresses({ items }: { items: { id: string; label: string | null; city: string; branch: string | null; street: string | null; isDefault: boolean }[] }) {
  const [state, action] = useActionState<ActionState, FormData>(saveAddressAction, {});
  const [pending, start] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  React.useEffect(() => { if (state.ok) formRef.current?.reset(); }, [state]);
  return (
    <div className="grid gap-4">
      <ul className="grid gap-2">
        {items.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <span className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" />
              <span>
                <span className="font-semibold">{a.label ?? a.city}</span> {a.isDefault && <Badge tone="primary" className="ml-1">основна</Badge>}
                <span className="block text-muted-foreground">{[a.city, a.branch, a.street].filter(Boolean).join(", ")}</span>
              </span>
            </span>
            <Button variant="ghost" size="icon-sm" disabled={pending} onClick={() => start(() => deleteAddressAction(a.id))} aria-label="Видалити адресу"><Trash2 /></Button>
          </li>
        ))}
        {!items.length && <li className="text-sm text-muted-foreground">Адрес ще немає — збережіть, щоб швидше оформлювати замовлення.</li>}
      </ul>
      <form ref={formRef} action={action} className="grid gap-3 rounded-lg border border-dashed p-4 sm:grid-cols-2">
        <Field label="Назва" htmlFor="label"><Input id="label" name="label" placeholder="Гараж, офіс…" /></Field>
        <Field label="Місто" htmlFor="city" error={state.fieldErrors?.city} required><Input id="city" name="city" /></Field>
        <Field label="Відділення НП" htmlFor="branch"><Input id="branch" name="branch" placeholder="Відділення №1" /></Field>
        <Field label="Адреса (для кур'єра)" htmlFor="street"><Input id="street" name="street" /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><Checkbox name="isDefault" /> Зробити основною</label>
        <div className="sm:col-span-2"><FormMessage state={state} /></div>
        <div className="sm:col-span-2"><SubmitButton variant="secondary">Додати адресу</SubmitButton></div>
      </form>
    </div>
  );
}

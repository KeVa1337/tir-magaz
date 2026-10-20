"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { KeyRound, Smartphone } from "lucide-react";
import { loginAction, phoneOtpAction, registerAction } from "@/server/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActionState } from "@/lib/validators";

const DEMO_USERS = [
  { email: "client@demo.ua", role: "Клієнт: гараж (2 тягачі + причіп), замовлення, VIN-запити" },
  { email: "manager@demo.ua", role: "Менеджер: замовлення, VIN-запити, товари" },
  { email: "admin@demo.ua", role: "Адміністратор: усе, включно з налаштуваннями та імпортом" },
];

export function LoginForm({ callbackUrl, demo }: { callbackUrl?: string; demo: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});
  const [otp, otpAction] = useActionState<ActionState, FormData>(phoneOtpAction, {});
  const formRef = React.useRef<HTMLFormElement>(null);

  const fill = (email: string) => {
    const f = formRef.current;
    if (!f) return;
    (f.elements.namedItem("email") as HTMLInputElement).value = email;
    (f.elements.namedItem("password") as HTMLInputElement).value = "demo1234";
    f.requestSubmit();
  };

  return (
    <div className="grid gap-6">
      <Tabs defaultValue="email">
        <TabsList>
          <TabsTrigger value="email"><KeyRound className="mr-1.5 inline size-4" />Email і пароль</TabsTrigger>
          <TabsTrigger value="phone"><Smartphone className="mr-1.5 inline size-4" />Телефон</TabsTrigger>
        </TabsList>
        <TabsContent value="email">
          <form ref={formRef} action={action} className="grid gap-4" noValidate>
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
            <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
              <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={!!state.fieldErrors?.email} />
            </Field>
            <Field label="Пароль" htmlFor="password" error={state.fieldErrors?.password}>
              <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={!!state.fieldErrors?.password} />
            </Field>
            <FormMessage state={state} />
            <SubmitButton size="lg" pendingText="Входимо…">Увійти</SubmitButton>
          </form>
        </TabsContent>
        <TabsContent value="phone">
          <form action={otpAction} className="grid gap-4">
            <Field label="Номер телефону" htmlFor="phone" error={otp.fieldErrors?.phone} hint="Надішлемо SMS з одноразовим кодом">
              <Input id="phone" name="phone" type="tel" inputMode="tel" placeholder="+380 67 123 45 67" autoComplete="tel" />
            </Field>
            <FormMessage state={otp} />
            <SubmitButton size="lg" variant="secondary">Отримати код</SubmitButton>
          </form>
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground">
        Немає акаунта? <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="font-semibold text-foreground underline">Зареєструватися</Link>
      </p>

      {demo && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-bold">Демо-доступи · пароль <span className="font-num">demo1234</span></p>
          <div className="mt-3 grid gap-2">
            {DEMO_USERS.map((u) => (
              <button key={u.email} type="button" onClick={() => fill(u.email)} className="cursor-pointer rounded-lg border bg-card px-3 py-2.5 text-left hover:border-primary/60">
                <span className="block font-num text-sm font-semibold">{u.email}</span>
                <span className="text-xs text-muted-foreground">{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(registerAction, {});
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="Ім'я та прізвище" htmlFor="name" error={state.fieldErrors?.name} required>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email} required>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
      </Field>
      <Field label="Телефон" htmlFor="phone" error={state.fieldErrors?.phone} hint="Для зв'язку щодо замовлень і VIN-запитів">
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380 67 123 45 67" />
      </Field>
      <Field label="Пароль" htmlFor="password" error={state.fieldErrors?.password} required hint="Мінімум 8 символів">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingText="Створюємо…">Створити акаунт</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Вже є акаунт? <Link href="/login" className="font-semibold text-foreground underline">Увійти</Link>
      </p>
    </form>
  );
}

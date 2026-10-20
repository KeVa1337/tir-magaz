"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/server/actions/admin";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "@/lib/labels";
import type { ActionState } from "@/lib/validators";

export interface SettingsValues {
  general: { name: string; tagline: string; phone: string; phone2?: string; email: string; address: string; schedule: string; telegram?: string };
  commerce: { eurRate: number; defaultMarkupPercent: number; freeShippingFrom: number; deliveryMethods: string[]; paymentMethods: string[] };
  vin: { slaHours: number; notifyEmail: string };
  notifications: { orderEmail: string; sendCustomerEmails: boolean };
  synonyms: string[][];
}

function Section({ section, title, children }: { section: string; title: string; children: React.ReactNode }) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettingsAction, {});
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="grid gap-3">
          <input type="hidden" name="section" value={section} />
          {children}
          <FormMessage state={state} />
          <SubmitButton variant="secondary" className="justify-self-start">Зберегти</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsForms({ s }: { s: SettingsValues }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section section="general" title="Магазин і контакти">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Назва"><Input name="name" defaultValue={s.general.name} /></Field>
          <Field label="Слоган"><Input name="tagline" defaultValue={s.general.tagline} /></Field>
          <Field label="Телефон"><Input name="phone" defaultValue={s.general.phone} /></Field>
          <Field label="Додатковий телефон"><Input name="phone2" defaultValue={s.general.phone2} /></Field>
          <Field label="Email"><Input name="email" defaultValue={s.general.email} /></Field>
          <Field label="Telegram"><Input name="telegram" defaultValue={s.general.telegram} /></Field>
          <Field label="Адреса складу" className="sm:col-span-2"><Input name="address" defaultValue={s.general.address} /></Field>
          <Field label="Графік роботи" className="sm:col-span-2"><Input name="schedule" defaultValue={s.general.schedule} /></Field>
        </div>
      </Section>
      <Section section="commerce" title="Ціни, доставка, оплата">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Курс EUR, ₴" hint="Для перерахунку прайсів у євро (🟡)"><Input name="eurRate" defaultValue={s.commerce.eurRate} inputMode="decimal" /></Field>
          <Field label="Націнка за замовч., %" hint="Для імпорту з закупівельною ціною"><Input name="defaultMarkupPercent" defaultValue={s.commerce.defaultMarkupPercent} inputMode="numeric" /></Field>
          <Field label="Безкоштовна доставка від, ₴"><Input name="freeShippingFrom" defaultValue={s.commerce.freeShippingFrom} inputMode="numeric" /></Field>
        </div>
        <fieldset className="grid gap-1.5"><legend className="mb-1 text-sm font-semibold">Способи доставки</legend>
          {DELIVERY_METHODS.map((m) => <label key={m.id} className="flex items-center gap-2 text-sm"><Checkbox name="deliveryMethods" value={m.id} defaultChecked={s.commerce.deliveryMethods.includes(m.id)} /> {m.label}</label>)}
        </fieldset>
        <fieldset className="grid gap-1.5"><legend className="mb-1 text-sm font-semibold">Способи оплати</legend>
          {PAYMENT_METHODS.map((m) => <label key={m.id} className="flex items-center gap-2 text-sm"><Checkbox name="paymentMethods" value={m.id} defaultChecked={s.commerce.paymentMethods.includes(m.id)} /> {m.label}</label>)}
        </fieldset>
      </Section>
      <Section section="vin" title="VIN-запити">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="SLA відповіді, год" hint="Таймер у черзі запитів"><Input name="slaHours" defaultValue={s.vin.slaHours} inputMode="numeric" /></Field>
          <Field label="Email для нових запитів"><Input name="notifyEmail" defaultValue={s.vin.notifyEmail} /></Field>
        </div>
      </Section>
      <Section section="notifications" title="Email-сповіщення">
        <Field label="Email для нових замовлень"><Input name="orderEmail" defaultValue={s.notifications.orderEmail} /></Field>
        <label className="flex items-center gap-2 text-sm"><Checkbox name="sendCustomerEmails" defaultChecked={s.notifications.sendCustomerEmails} /> Надсилати клієнтам листи про статус замовлення</label>
        <p className="text-xs text-muted-foreground">У демо листи пишуться в лог сервера. 🟡 Підключення SMTP / Telegram — після погодження.</p>
      </Section>
      <Section section="synonyms" title="Синоніми пошуку">
        <Field label="Групи синонімів" hint="Одна група на рядок, слова через кому. Пошук за будь-яким словом знаходить усі.">
          <Textarea name="synonyms" rows={7} defaultValue={s.synonyms.map((g) => g.join(", ")).join("\n")} />
        </Field>
      </Section>
    </div>
  );
}

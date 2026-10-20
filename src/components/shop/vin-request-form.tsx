"use client";

import * as React from "react";
import { useActionState } from "react";
import { Paperclip } from "lucide-react";
import { createVinRequestAction } from "@/server/actions/account";
import { Field, FormMessage, SubmitButton } from "@/components/shared/form";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import type { ActionState } from "@/lib/validators";

export function VinRequestForm({ loggedIn, vehicles = [], defaultVehicleId, defaultVin, defaultMessage }: {
  loggedIn: boolean;
  vehicles?: { id: string; label: string }[];
  defaultVehicleId?: string;
  defaultVin?: string;
  defaultMessage?: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(createVinRequestAction, {});
  const [vehicleId, setVehicleId] = React.useState(defaultVehicleId ?? vehicles[0]?.id ?? "");
  const [files, setFiles] = React.useState<string[]>([]);

  if (state.ok && state.message)
    return <FormMessage state={state} />;

  return (
    <form action={action} className="grid gap-4" noValidate>
      {loggedIn && vehicles.length > 0 && (
        <Field label="Авто з гаража" htmlFor="vehicleId">
          <NativeSelect id="vehicleId" name="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            <option value="">Інше авто — вкажу VIN</option>
          </NativeSelect>
        </Field>
      )}
      {(!loggedIn || !vehicleId) && (
        <Field label="VIN або номер шасі" htmlFor="vin" error={state.fieldErrors?.vin} hint="17 символів з техпаспорта (поле E) або таблички на рамі">
          <Input id="vin" name="vin" defaultValue={defaultVin} className="font-num uppercase" autoCapitalize="characters" spellCheck={false} />
        </Field>
      )}
      {!loggedIn && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ваше ім'я" htmlFor="guestName" error={state.fieldErrors?.guestName}>
            <Input id="guestName" name="guestName" autoComplete="name" />
          </Field>
          <Field label="Телефон" htmlFor="guestPhone" error={state.fieldErrors?.guestPhone} required>
            <Input id="guestPhone" name="guestPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+380…" />
          </Field>
        </div>
      )}
      <Field label="Що потрібно підібрати" htmlFor="message" error={state.fieldErrors?.message} required>
        <Textarea id="message" name="message" rows={4} defaultValue={defaultMessage} placeholder="Наприклад: колодки передні, фільтр паливний, амортизатори кабіни задні" />
      </Field>
      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm font-semibold hover:bg-accent">
          <Paperclip className="size-4" /> Додати фото деталі / техпаспорта
          <input type="file" name="files" accept="image/*,application/pdf" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => f.name))} />
        </label>
        {files.length > 0 && <p className="mt-1.5 text-xs text-muted-foreground">{files.join(", ")}</p>}
      </div>
      <FormMessage state={state} />
      <SubmitButton size="lg" pendingText="Надсилаємо…">Надіслати менеджеру</SubmitButton>
    </form>
  );
}

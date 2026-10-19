"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import type { ActionState } from "@/lib/validators";

/** Діалог з формою на server action: закривається після успіху. */
export function FormDialog({ title, trigger, action, children, success = "Збережено" }: {
  title: string; trigger: React.ReactNode; action: (prev: ActionState, fd: FormData) => Promise<ActionState>; children: React.ReactNode; success?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) { setOpen(false); toast.success(success); }
    return res;
  }, {});
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <form action={formAction} className="grid gap-3">
          {children}
          {state.fieldErrors && <p className="text-sm text-danger">{Object.values(state.fieldErrors).flat()[0]}</p>}
          <FormMessage state={{ error: state.error }} />
          <SubmitButton>Зберегти</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Кнопка видалення з підтвердженням браузера. */
export function DeleteButton({ onDelete, label = "Видалити?", children }: { onDelete: () => Promise<{ ok: boolean; error?: string }>; label?: string; children: React.ReactNode }) {
  const [pending, start] = React.useTransition();
  return (
    <span
      role="button"
      tabIndex={0}
      aria-disabled={pending}
      onClick={() => { if (!pending && confirm(label)) start(async () => { const r = await onDelete(); if (!r.ok) toast.error(r.error); else toast.success("Видалено"); }); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLElement).click(); }}
      className="inline-flex"
    >
      {children}
    </span>
  );
}

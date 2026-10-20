"use client";

import { useActionState } from "react";
import { customerNoteAction } from "@/server/actions/admin";
import { Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/shared/form";
import type { ActionState } from "@/lib/validators";

export function CustomerNoteForm({ id, note }: { id: string; note: string }) {
  const [state, action] = useActionState<ActionState, FormData>(customerNoteAction, {});
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <Textarea name="note" rows={4} defaultValue={note} placeholder="Видно лише співробітникам: умови, переваги, борги…" aria-label="Нотатка менеджера" />
      <FormMessage state={state} />
      <SubmitButton size="sm" variant="secondary" className="justify-self-start">Зберегти нотатку</SubmitButton>
    </form>
  );
}

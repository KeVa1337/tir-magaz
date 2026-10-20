"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";
import { createStaffAction, updateUserAction } from "@/server/actions/admin";
import { FormDialog } from "./form-dialog";
import { Field } from "@/components/shared/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { ROLE_LABEL } from "@/lib/labels";

interface Staff { id: string; name: string | null; email: string | null; role: Role; isActive: boolean; createdAt: string }

export function UsersManager({ users, meId }: { users: Staff[]; meId: string }) {
  const [pending, start] = React.useTransition();
  const update = (id: string, data: { role?: Role; isActive?: boolean }) =>
    start(async () => { const r = await updateUserAction(id, data); if (r.ok) toast.success("Оновлено"); else toast.error(r.error); });
  return (
    <div className="grid gap-4">
      <div>
        <FormDialog title="Додати співробітника" action={createStaffAction} trigger={<Button><Plus /> Співробітник</Button>}>
          <Field label="Ім'я"><Input name="name" /></Field>
          <Field label="Email" required hint="Якщо користувач уже існує (напр. клієнт) — йому буде змінено роль"><Input name="email" type="email" /></Field>
          <Field label="Роль"><NativeSelect name="role" defaultValue="MANAGER"><option value="MANAGER">Менеджер</option><option value="ADMIN">Адміністратор</option></NativeSelect></Field>
          <Field label="Пароль" hint="Порожньо — demo1234"><Input name="password" type="password" autoComplete="new-password" /></Field>
        </FormDialog>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-xs text-muted-foreground uppercase"><tr><th className="px-3 py-2 text-left">Співробітник</th><th className="px-3 py-2 text-left">Роль</th><th className="px-3 py-2 text-left">Статус</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-3 py-2"><span className="font-semibold">{u.name}</span>{u.id === meId && <Badge className="ml-2">це ви</Badge>}<span className="block text-xs text-muted-foreground">{u.email}</span></td>
                <td className="px-3 py-2">
                  <NativeSelect value={u.role} disabled={pending || u.id === meId} onChange={(e) => update(u.id, { role: e.target.value as Role })} className="h-8 w-48" aria-label="Роль">
                    {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </NativeSelect>
                </td>
                <td className="px-3 py-2">{u.isActive ? <Badge tone="green">активний</Badge> : <Badge tone="red">вимкнений</Badge>}</td>
                <td className="px-3 py-2 text-right">
                  {u.id !== meId && <Button size="sm" variant="ghost" disabled={pending} onClick={() => update(u.id, { isActive: !u.isActive })}>{u.isActive ? "Вимкнути доступ" : "Увімкнути"}</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Менеджер: замовлення, VIN-запити, клієнти, товари, контент. Адміністратор: усе, включно з імпортом, налаштуваннями і ролями.</p>
    </div>
  );
}

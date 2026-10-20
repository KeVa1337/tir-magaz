"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { setVehicleContextAction } from "@/server/actions/shop";
import { deleteVehicleAction, updateMileageAction } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatKm } from "@/lib/format";

export function UseVehicleButton({ vehicleId, label = "Каталог для цього авто", to = "/catalog?fit=1", variant = "default" }: { vehicleId: string; label?: string; to?: string; variant?: "default" | "outline" | "secondary" }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button variant={variant} disabled={pending} onClick={() => start(async () => { await setVehicleContextAction(`v:${vehicleId}`); router.push(to); })}>
      {pending ? <Loader2 className="animate-spin" /> : <Search />} {label}
    </Button>
  );
}

export function MileageEditor({ vehicleId, mileage }: { vehicleId: string; mileage: number | null }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(mileage ? String(mileage) : "");
  const [pending, start] = React.useTransition();
  if (!editing)
    return (
      <button onClick={() => setEditing(true)} className="inline-flex cursor-pointer items-center gap-1.5 font-num font-bold hover:text-primary" title="Оновити пробіг">
        {formatKm(mileage)} <Pencil className="size-3.5 text-muted-foreground" />
      </button>
    );
  return (
    <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); start(async () => { await updateMileageAction(vehicleId, Number(value)); setEditing(false); toast.success("Пробіг оновлено"); }); }}>
      <Input autoFocus inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} className="h-8 w-32 font-num" aria-label="Пробіг, км" />
      <Button size="icon-sm" type="submit" disabled={pending} aria-label="Зберегти">{pending ? <Loader2 className="animate-spin" /> : <Check />}</Button>
    </form>
  );
}

export function DeleteVehicleButton({ vehicleId, name }: { vehicleId: string; name: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="ghost" className="text-danger hover:bg-danger/10 hover:text-danger"><Trash2 /> Видалити</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Видалити «{name}» з гаража?</DialogTitle>
        <DialogDescription>Прив&apos;язані OE-номери буде видалено. Замовлення й VIN-запити залишаться в історії.</DialogDescription>
        <div className="flex justify-end gap-2">
          <DialogClose asChild><Button variant="outline">Скасувати</Button></DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => start(() => deleteVehicleAction(vehicleId))}>{pending && <Loader2 className="animate-spin" />} Видалити</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
